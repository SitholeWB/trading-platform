using System.Collections.Concurrent;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace TradingPlatform.Application.Common.CQRS;

public class CustomMediator : IMediator
{
    private readonly IServiceProvider _serviceProvider;
    private static readonly ConcurrentDictionary<Type, MethodInfo> _sendMethodCache = new();
    private static readonly ConcurrentDictionary<Type, Type> _handlerTypeCache = new();

    public CustomMediator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var requestType = request.GetType();
        var handlerType = _handlerTypeCache.GetOrAdd(
            requestType,
            reqType => typeof(IRequestHandler<,>).MakeGenericType(reqType, typeof(TResponse)));

        var handler = _serviceProvider.GetService(handlerType);
        if (handler == null)
        {
            throw new InvalidOperationException($"No handler registered for request type '{requestType.FullName}' with response type '{typeof(TResponse).FullName}'.");
        }

        // Retrieve pipeline behaviors
        var behaviorType = typeof(IPipelineBehavior<,>).MakeGenericType(requestType, typeof(TResponse));
        var behaviors = _serviceProvider.GetServices(behaviorType)
            .Cast<dynamic>()
            .Reverse()
            .ToList();

        // Build execution delegate chain
        RequestHandlerDelegate<TResponse> executionChain = () =>
        {
            var method = handlerType.GetMethod("Handle")!;
            return (Task<TResponse>)method.Invoke(handler, new object[] { request, ct })!;
        };

        foreach (var behavior in behaviors)
        {
            var next = executionChain;
            var b = behavior;
            executionChain = () => (Task<TResponse>)b.Handle((dynamic)request, next, ct);
        }

        return await executionChain().ConfigureAwait(false);
    }

    public async Task Publish<TNotification>(TNotification notification, CancellationToken ct = default)
        where TNotification : INotification
    {
        ArgumentNullException.ThrowIfNull(notification);

        var handlers = _serviceProvider.GetServices<INotificationHandler<TNotification>>();
        foreach (var handler in handlers)
        {
            await handler.Handle(notification, ct).ConfigureAwait(false);
        }
    }
}
