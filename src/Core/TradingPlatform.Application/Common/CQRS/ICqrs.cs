namespace TradingPlatform.Application.Common.CQRS;

public readonly struct Unit : IEquatable<Unit>, IComparable<Unit>, IComparable
{
    public static readonly Unit Value = new();

    public static Task<Unit> Task { get; } = System.Threading.Tasks.Task.FromResult(Value);

    public int CompareTo(Unit other) => 0;

    int IComparable.CompareTo(object? obj) => 0;

    public override int GetHashCode() => 0;

    public bool Equals(Unit other) => true;

    public override bool Equals(object? obj) => obj is Unit;

    public static bool operator ==(Unit first, Unit second) => true;

    public static bool operator !=(Unit first, Unit second) => false;

    public override string ToString() => "()";
}

public interface IRequest<out TResponse> { }

public interface ICommand<out TResponse> : IRequest<TResponse> { }

public interface ICommand : IRequest<Unit> { }

public interface IQuery<out TResponse> : IRequest<TResponse> { }

public interface INotification { }

public delegate Task<TResponse> RequestHandlerDelegate<TResponse>();

public interface IRequestHandler<in TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct);
}

public interface INotificationHandler<in TNotification> where TNotification : INotification
{
    Task Handle(TNotification notification, CancellationToken ct);
}

public interface IPipelineBehavior<in TRequest, TResponse> where TRequest : notnull
{
    Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct);
}

public interface ISender
{
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken ct = default);
}

public interface IPublisher
{
    Task Publish<TNotification>(TNotification notification, CancellationToken ct = default) where TNotification : INotification;
}

public interface IMediator : ISender, IPublisher { }
