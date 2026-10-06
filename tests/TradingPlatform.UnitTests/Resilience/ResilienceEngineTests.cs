using TradingPlatform.Application;
using Xunit;

namespace TradingPlatform.UnitTests;

public class ResilienceEngineTests
{
    [Fact]
    public async Task RetryPolicy_RetriesUntilSuccess()
    {
        int attempts = 0;
        var retry = new RetryPolicy(maxRetries: 3, initialDelay: TimeSpan.FromMilliseconds(10), backoffMultiplier: 1.0, useJitter: false);

        var result = await retry.ExecuteAsync(async ct =>
        {
            attempts++;
            if (attempts < 3)
            {
                throw new HttpRequestException("Transient network blip");
            }
            return await Task.FromResult("Success");
        }, CancellationToken.None);

        Assert.Equal("Success", result);
        Assert.Equal(3, attempts);
    }

    [Fact]
    public void CircuitBreaker_TripsToOpen_AfterConsecutiveFailures()
    {
        var cb = new CircuitBreakerPolicy(failureThreshold: 2, breakDuration: TimeSpan.FromSeconds(5));

        Assert.Equal(CircuitState.Closed, cb.State);

        cb.ReportFailure(new Exception("Error 1"));
        Assert.Equal(CircuitState.Closed, cb.State);

        cb.ReportFailure(new Exception("Error 2"));
        Assert.Equal(CircuitState.Open, cb.State);

        // While open, CheckCanExecute throws CircuitBreakerOpenException
        Assert.Throws<CircuitBreakerOpenException>(() => cb.CheckCanExecute());

        // Reset restores state to Closed
        cb.Reset();
        Assert.Equal(CircuitState.Closed, cb.State);
    }

    [Fact]
    public async Task ResiliencePipeline_CombinesRetryAndCircuitBreaker()
    {
        var cb = new CircuitBreakerPolicy(failureThreshold: 5, breakDuration: TimeSpan.FromSeconds(2));
        var retry = new RetryPolicy(maxRetries: 2, initialDelay: TimeSpan.FromMilliseconds(5), backoffMultiplier: 1.0, useJitter: false);
        var pipeline = new ResiliencePipeline(retry, cb);

        int count = 0;
        var result = await pipeline.ExecuteAsync(async ct =>
        {
            count++;
            if (count == 1) throw new InvalidOperationException("Fail once");
            return await Task.FromResult(42);
        });

        Assert.Equal(42, result);
        Assert.Equal(2, count);
        Assert.Equal(CircuitState.Closed, cb.State);
    }
}
