using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TradingPlatform.Application.Common.CQRS;
using TradingPlatform.Application.Common.Validation;
using Xunit;

namespace TradingPlatform.UnitTests.CQRS;

public class CqrsDispatcherTests
{
    // Test command & handler
    public record PingCommand(string Message) : ICommand;
    public class PingCommandHandler : ICommandHandler<PingCommand>
    {
        public static bool WasHandled { get; set; }
        public Task HandleAsync(PingCommand command, CancellationToken ct = default)
        {
            WasHandled = true;
            return Task.CompletedTask;
        }
    }

    // Test command with result & handler
    public record AddNumbersCommand(int A, int B) : ICommand<int>;
    public class AddNumbersCommandHandler : ICommandHandler<AddNumbersCommand, int>
    {
        public Task<int> HandleAsync(AddNumbersCommand command, CancellationToken ct = default) =>
            Task.FromResult(command.A + command.B);
    }

    // Test query & handler
    public record GetGreetingQuery(string Name) : IQuery<string>;
    public class GetGreetingQueryHandler : IQueryHandler<GetGreetingQuery, string>
    {
        public Task<string> HandleAsync(GetGreetingQuery query, CancellationToken ct = default) =>
            Task.FromResult($"Hello, {query.Name}!");
    }

    // Test validated command
    public record ValidatedCommand(string Name) : ICommand<string>;
    public class ValidatedCommandValidator : AbstractValidator<ValidatedCommand>
    {
        public ValidatedCommandValidator()
        {
            RuleFor(x => x.Name).NotEmpty("Name is required.");
        }
    }
    public class ValidatedCommandHandler : ICommandHandler<ValidatedCommand, string>
    {
        public Task<string> HandleAsync(ValidatedCommand command, CancellationToken ct = default) =>
            Task.FromResult($"Valid: {command.Name}");
    }

    [Fact]
    public async Task DispatchAsync_VoidCommand_SuccessfullyExecutesHandler()
    {
        PingCommandHandler.WasHandled = false;
        var services = new ServiceCollection();
        services.AddScoped<ICommandHandler<PingCommand>, PingCommandHandler>();
        var sp = services.BuildServiceProvider();

        var dispatcher = new CqrsDispatcher(sp, NullLogger<CqrsDispatcher>.Instance);
        await dispatcher.DispatchAsync(new PingCommand("Test"));

        Assert.True(PingCommandHandler.WasHandled);
    }

    [Fact]
    public async Task DispatchAsync_CommandWithResult_ReturnsExpectedValue()
    {
        var services = new ServiceCollection();
        services.AddScoped<ICommandHandler<AddNumbersCommand, int>, AddNumbersCommandHandler>();
        var sp = services.BuildServiceProvider();

        var dispatcher = new CqrsDispatcher(sp, NullLogger<CqrsDispatcher>.Instance);
        var result = await dispatcher.DispatchAsync(new AddNumbersCommand(10, 25));

        Assert.Equal(35, result);
    }

    [Fact]
    public async Task QueryAsync_Query_ReturnsExpectedValue()
    {
        var services = new ServiceCollection();
        services.AddScoped<IQueryHandler<GetGreetingQuery, string>, GetGreetingQueryHandler>();
        var sp = services.BuildServiceProvider();

        var dispatcher = new CqrsDispatcher(sp, NullLogger<CqrsDispatcher>.Instance);
        var result = await dispatcher.QueryAsync(new GetGreetingQuery("Alice"));

        Assert.Equal("Hello, Alice!", result);
    }

    [Fact]
    public async Task DispatchAsync_WhenValidationFails_ThrowsValidationException()
    {
        var services = new ServiceCollection();
        services.AddScoped<IValidator<ValidatedCommand>, ValidatedCommandValidator>();
        services.AddScoped<ICommandHandler<ValidatedCommand, string>, ValidatedCommandHandler>();
        var sp = services.BuildServiceProvider();

        var dispatcher = new CqrsDispatcher(sp, NullLogger<CqrsDispatcher>.Instance);

        await Assert.ThrowsAsync<ValidationException>(async () =>
        {
            await dispatcher.DispatchAsync(new ValidatedCommand(""));
        });
    }

    [Fact]
    public async Task DispatchAsync_MissingHandler_ThrowsInvalidOperationException()
    {
        var services = new ServiceCollection();
        var sp = services.BuildServiceProvider();

        var dispatcher = new CqrsDispatcher(sp, NullLogger<CqrsDispatcher>.Instance);

        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await dispatcher.DispatchAsync(new PingCommand("Unhandled"));
        });
    }
}
