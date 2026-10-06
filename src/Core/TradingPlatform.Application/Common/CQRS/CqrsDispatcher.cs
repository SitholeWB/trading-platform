using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
namespace TradingPlatform.Application;

public class CqrsDispatcher : ICqrsDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CqrsDispatcher> _logger;

    private static readonly ConcurrentDictionary<Type, MethodInfo> _commandVoidMethodCache = new();
    private static readonly ConcurrentDictionary<Type, MethodInfo> _commandResultMethodCache = new();
    private static readonly ConcurrentDictionary<Type, MethodInfo> _queryMethodCache = new();

    public CqrsDispatcher(IServiceProvider serviceProvider, ILogger<CqrsDispatcher> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task DispatchAsync<TCommand>(TCommand command, CancellationToken ct = default) where TCommand : ICommand
    {
        ArgumentNullException.ThrowIfNull(command);
        var commandType = typeof(TCommand);

        ValidateCommand(command, commandType);

        var handlerType = typeof(ICommandHandler<>).MakeGenericType(commandType);
        var handler = _serviceProvider.GetService(handlerType);
        if (handler == null)
        {
            throw new InvalidOperationException($"No command handler registered for command '{commandType.FullName}'.");
        }

        _logger.LogInformation("[CQRS COMMAND] Processing: {CommandName}", commandType.Name);

        var method = _commandVoidMethodCache.GetOrAdd(
            handlerType,
            t => t.GetMethod(nameof(ICommandHandler<TCommand>.HandleAsync))!);

        var task = (Task)method.Invoke(handler, new object[] { command, ct })!;
        await task.ConfigureAwait(false);
    }

    public async Task<TResult> DispatchAsync<TResult>(ICommand<TResult> command, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(command);
        var commandType = command.GetType();

        ValidateCommand(command, commandType);

        var handlerType = typeof(ICommandHandler<,>).MakeGenericType(commandType, typeof(TResult));
        var handler = _serviceProvider.GetService(handlerType);
        if (handler == null)
        {
            throw new InvalidOperationException($"No command handler registered for command '{commandType.FullName}' with return type '{typeof(TResult).FullName}'.");
        }

        _logger.LogInformation("[CQRS COMMAND] Processing: {CommandName}", commandType.Name);

        var method = _commandResultMethodCache.GetOrAdd(
            handlerType,
            t => t.GetMethod(nameof(ICommandHandler<ICommand<TResult>, TResult>.HandleAsync))!);

        var task = (Task<TResult>)method.Invoke(handler, new object[] { command, ct })!;
        return await task.ConfigureAwait(false);
    }

    public async Task<TResult> QueryAsync<TResult>(IQuery<TResult> query, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(query);
        var queryType = query.GetType();
        var handlerType = typeof(IQueryHandler<,>).MakeGenericType(queryType, typeof(TResult));

        var handler = _serviceProvider.GetService(handlerType);
        if (handler == null)
        {
            throw new InvalidOperationException($"No query handler registered for query '{queryType.FullName}' with return type '{typeof(TResult).FullName}'.");
        }

        // Queries are logged at Debug level so periodic UI telemetry polling does not flood application console logs.
        _logger.LogDebug("[CQRS QUERY] Executing: {QueryName}", queryType.Name);

        var method = _queryMethodCache.GetOrAdd(
            handlerType,
            t => t.GetMethod(nameof(IQueryHandler<IQuery<TResult>, TResult>.HandleAsync))!);

        var task = (Task<TResult>)method.Invoke(handler, new object[] { query, ct })!;
        return await task.ConfigureAwait(false);
    }

    private void ValidateCommand(object command, Type commandType)
    {
        var validatorType = typeof(IValidator<>).MakeGenericType(commandType);
        var validator = _serviceProvider.GetService(validatorType);
        if (validator != null)
        {
            var validateMethod = validatorType.GetMethod(nameof(IValidator<object>.Validate))!;
            var result = (ValidationResult)validateMethod.Invoke(validator, new object[] { command })!;
            if (!result.IsValid)
            {
                throw new ValidationException(result.Errors);
            }
        }
    }
}
