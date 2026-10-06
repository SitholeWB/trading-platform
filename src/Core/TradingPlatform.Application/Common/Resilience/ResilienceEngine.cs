using Microsoft.Extensions.Logging;

namespace TradingPlatform.Application;

public enum CircuitState
{
    Closed,
    Open,
    HalfOpen
}

public class CircuitBreakerOpenException : Exception
{
    public DateTime ResetTimeUtc { get; }

    public CircuitBreakerOpenException(string message, DateTime resetTimeUtc)
        : base(message)
    {
        ResetTimeUtc = resetTimeUtc;
    }
}

public class CircuitBreakerPolicy
{
    private readonly int _failureThreshold;
    private readonly TimeSpan _breakDuration;
    private readonly ILogger? _logger;
    private readonly object _lock = new();

    private int _consecutiveFailures;
    private DateTime _lastStateChangeUtc = DateTime.UtcNow;
    private DateTime _openedUntilUtc = DateTime.MinValue;
    private CircuitState _state = CircuitState.Closed;

    public CircuitState State
    {
        get
        {
            lock (_lock)
            {
                if (_state == CircuitState.Open && DateTime.UtcNow >= _openedUntilUtc)
                {
                    _state = CircuitState.HalfOpen;
                    _logger?.LogInformation("[CIRCUIT BREAKER] State transitioned from Open to HalfOpen (probe trial).");
                }
                return _state;
            }
        }
    }

    public CircuitBreakerPolicy(int failureThreshold, TimeSpan breakDuration, ILogger? logger = null)
    {
        if (failureThreshold <= 0) throw new ArgumentOutOfRangeException(nameof(failureThreshold));
        _failureThreshold = failureThreshold;
        _breakDuration = breakDuration;
        _logger = logger;
    }

    public void CheckCanExecute()
    {
        var currentState = State;
        if (currentState == CircuitState.Open)
        {
            throw new CircuitBreakerOpenException(
                $"Circuit breaker is OPEN. Execution blocked until {_openedUntilUtc:O}.", _openedUntilUtc);
        }
    }

    public void ReportSuccess()
    {
        lock (_lock)
        {
            if (_state == CircuitState.HalfOpen || _consecutiveFailures > 0)
            {
                _logger?.LogInformation("[CIRCUIT BREAKER] Execution succeeded. Resetting circuit to CLOSED state.");
            }
            _state = CircuitState.Closed;
            _consecutiveFailures = 0;
        }
    }

    public void ReportFailure(Exception ex)
    {
        lock (_lock)
        {
            _consecutiveFailures++;
            if (_state == CircuitState.HalfOpen || _consecutiveFailures >= _failureThreshold)
            {
                _state = CircuitState.Open;
                _openedUntilUtc = DateTime.UtcNow.Add(_breakDuration);
                _lastStateChangeUtc = DateTime.UtcNow;
                _logger?.LogWarning(ex, "[CIRCUIT BREAKER] Tripped to OPEN state for {DurationSeconds}s due to {Failures} consecutive failures.",
                    _breakDuration.TotalSeconds, _consecutiveFailures);
            }
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            _state = CircuitState.Closed;
            _consecutiveFailures = 0;
            _openedUntilUtc = DateTime.MinValue;
        }
    }
}

public class RetryPolicy
{
    public int MaxRetries { get; }
    public TimeSpan InitialDelay { get; }
    public double BackoffMultiplier { get; }
    public bool UseJitter { get; }
    private readonly Func<Exception, bool> _shouldRetryPredicate;
    private readonly ILogger? _logger;

    public RetryPolicy(
        int maxRetries = 3,
        TimeSpan? initialDelay = null,
        double backoffMultiplier = 2.0,
        bool useJitter = true,
        Func<Exception, bool>? shouldRetry = null,
        ILogger? logger = null)
    {
        MaxRetries = Math.Max(0, maxRetries);
        InitialDelay = initialDelay ?? TimeSpan.FromMilliseconds(200);
        BackoffMultiplier = backoffMultiplier;
        UseJitter = useJitter;
        _shouldRetryPredicate = shouldRetry ?? (_ => true);
        _logger = logger;
    }

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct)
    {
        var attempt = 0;
        while (true)
        {
            attempt++;
            try
            {
                return await action(ct);
            }
            catch (Exception ex) when (attempt <= MaxRetries && _shouldRetryPredicate(ex) && !ct.IsCancellationRequested)
            {
                var delayMs = InitialDelay.TotalMilliseconds * Math.Pow(BackoffMultiplier, attempt - 1);
                if (UseJitter)
                {
                    var jitter = Random.Shared.NextDouble() * (delayMs * 0.25);
                    delayMs += jitter;
                }

                _logger?.LogWarning(ex, "[RETRY POLICY] Attempt {Attempt}/{MaxRetries} failed: {Message}. Backing off for {DelayMs:F0}ms",
                    attempt, MaxRetries, ex.Message, delayMs);

                await Task.Delay(TimeSpan.FromMilliseconds(delayMs), ct);
            }
        }
    }
}

public class ResiliencePipeline
{
    private readonly RetryPolicy? _retryPolicy;
    private readonly CircuitBreakerPolicy? _circuitBreaker;
    private readonly TimeSpan? _timeout;
    private readonly ILogger? _logger;

    public ResiliencePipeline(
        RetryPolicy? retryPolicy = null,
        CircuitBreakerPolicy? circuitBreaker = null,
        TimeSpan? timeout = null,
        ILogger? logger = null)
    {
        _retryPolicy = retryPolicy;
        _circuitBreaker = circuitBreaker;
        _timeout = timeout;
        _logger = logger;
    }

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken ct = default)
    {
        Func<CancellationToken, Task<T>> wrappedAction = async innerCt =>
        {
            _circuitBreaker?.CheckCanExecute();

            using var timeoutCts = _timeout.HasValue
                ? CancellationTokenSource.CreateLinkedTokenSource(innerCt)
                : null;

            if (_timeout.HasValue)
            {
                timeoutCts!.CancelAfter(_timeout.Value);
            }

            var tokenToUse = timeoutCts?.Token ?? innerCt;

            try
            {
                var result = await action(tokenToUse);
                _circuitBreaker?.ReportSuccess();
                return result;
            }
            catch (Exception ex)
            {
                if (ex is not CircuitBreakerOpenException)
                {
                    _circuitBreaker?.ReportFailure(ex);
                }
                throw;
            }
        };

        if (_retryPolicy != null)
        {
            return await _retryPolicy.ExecuteAsync(wrappedAction, ct);
        }

        return await wrappedAction(ct);
    }

    public async Task ExecuteAsync(Func<CancellationToken, Task> action, CancellationToken ct = default)
    {
        await ExecuteAsync<bool>(async innerCt =>
        {
            await action(innerCt);
            return true;
        }, ct);
    }
}
