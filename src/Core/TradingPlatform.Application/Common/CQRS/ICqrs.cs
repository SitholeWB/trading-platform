namespace TradingPlatform.Application;

/// <summary>
/// Marker interface for a command that does not return a value.
/// </summary>
public interface ICommand { }

/// <summary>
/// Marker interface for a command that returns a result.
/// </summary>
public interface ICommand<out TResult> { }

/// <summary>
/// Handler for a command with no return value.
/// </summary>
public interface ICommandHandler<in TCommand> where TCommand : ICommand
{
    Task HandleAsync(TCommand command, CancellationToken ct = default);
}

/// <summary>
/// Handler for a command that produces a result.
/// </summary>
public interface ICommandHandler<in TCommand, TResult> where TCommand : ICommand<TResult>
{
    Task<TResult> HandleAsync(TCommand command, CancellationToken ct = default);
}

/// <summary>
/// Marker interface for a read-only query.
/// </summary>
public interface IQuery<out TResult> { }

/// <summary>
/// Handler for a read-only query.
/// </summary>
public interface IQueryHandler<in TQuery, TResult> where TQuery : IQuery<TResult>
{
    Task<TResult> HandleAsync(TQuery query, CancellationToken ct = default);
}

/// <summary>
/// CQRS dispatcher for state-modifying commands.
/// </summary>
public interface ICommandDispatcher
{
    Task DispatchAsync<TCommand>(TCommand command, CancellationToken ct = default) where TCommand : ICommand;
    Task<TResult> DispatchAsync<TResult>(ICommand<TResult> command, CancellationToken ct = default);
}

/// <summary>
/// CQRS dispatcher for read-only queries.
/// </summary>
public interface IQueryDispatcher
{
    Task<TResult> QueryAsync<TResult>(IQuery<TResult> query, CancellationToken ct = default);
}

/// <summary>
/// Combined CQRS dispatcher providing access to both command and query dispatching.
/// </summary>
public interface ICqrsDispatcher : ICommandDispatcher, IQueryDispatcher { }
