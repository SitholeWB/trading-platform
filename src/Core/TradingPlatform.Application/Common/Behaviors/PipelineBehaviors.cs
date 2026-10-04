using System.Diagnostics;
using Microsoft.Extensions.Logging;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;

namespace TradingPlatform.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        if (_validators.Any())
        {
            var failures = new List<ValidationError>();
            foreach (var validator in _validators)
            {
                var result = await validator.ValidateAsync(request, ct);
                if (!result.IsValid)
                {
                    failures.AddRange(result.Errors);
                }
            }

            if (failures.Count != 0)
            {
                throw new ValidationException(failures);
            }
        }

        return await next();
    }
}

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var requestName = typeof(TRequest).Name;
        bool isQuery = requestName.EndsWith("Query");

        if (isQuery)
        {
            _logger.LogDebug("[CQRS QUERY] Processing: {RequestName}", requestName);
        }
        else
        {
            _logger.LogInformation("[CQRS START] Processing command: {RequestName}", requestName);
        }

        try
        {
            var response = await next();
            if (!isQuery)
            {
                _logger.LogInformation("[CQRS SUCCESS] Successfully processed: {RequestName}", requestName);
            }
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[CQRS ERROR] Exception during processing of: {RequestName} - {ErrorMessage}", requestName, ex.Message);
            throw;
        }
    }
}

public class PerformanceMetricsBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private readonly ILogger<PerformanceMetricsBehavior<TRequest, TResponse>> _logger;
    private readonly Stopwatch _timer;

    public PerformanceMetricsBehavior(ILogger<PerformanceMetricsBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
        _timer = new Stopwatch();
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        _timer.Restart();
        var response = await next();
        _timer.Stop();

        var elapsedMilliseconds = _timer.ElapsedMilliseconds;
        if (elapsedMilliseconds > 500)
        {
            var requestName = typeof(TRequest).Name;
            _logger.LogWarning("[PERF SLOW] Long-running request detected: {RequestName} took {ElapsedMilliseconds} ms",
                requestName, elapsedMilliseconds);
        }

        return response;
    }
}
