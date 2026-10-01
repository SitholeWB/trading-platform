using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using TradingPlatform.Application.Common.Behaviors;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;
using Xunit;

namespace TradingPlatform.UnitTests.CQRS;

public record PingCommand(string Message) : ICommand<string>;

public class PingCommandValidator : AbstractValidator<PingCommand>
{
    public PingCommandValidator()
    {
        RuleFor(x => x.Message).NotEmpty("Message must not be empty.");
    }
}

public class PingCommandHandler : IRequestHandler<PingCommand, string>
{
    public Task<string> Handle(PingCommand request, CancellationToken ct) =>
        Task.FromResult($"PONG: {request.Message}");
}

public class CustomMediatorTests
{
    private readonly IServiceProvider _serviceProvider;

    public CustomMediatorTests()
    {
        var services = new ServiceCollection();

        // Register custom CQRS
        services.AddScoped<IMediator, CustomMediator>();
        services.AddScoped(typeof(ILogger<>), typeof(NullLogger<>));

        // Behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceMetricsBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        // Handler & Validator
        services.AddScoped<IRequestHandler<PingCommand, string>, PingCommandHandler>();
        services.AddScoped<IValidator<PingCommand>, PingCommandValidator>();

        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task Send_ValidCommand_ReturnsExpectedResponse()
    {
        var mediator = _serviceProvider.GetRequiredService<IMediator>();
        var result = await mediator.Send(new PingCommand("Hello Antigravity"));

        Assert.Equal("PONG: Hello Antigravity", result);
    }

    [Fact]
    public async Task Send_InvalidCommand_ThrowsValidationException()
    {
        var mediator = _serviceProvider.GetRequiredService<IMediator>();

        var ex = await Assert.ThrowsAsync<ValidationException>(() =>
            mediator.Send(new PingCommand("")));

        Assert.Single(ex.Errors);
        Assert.Equal("Message", ex.Errors[0].PropertyName);
    }
}
