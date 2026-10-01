using System.Linq.Expressions;

namespace TradingPlatform.Application.Common.Validation;

public record ValidationError(string PropertyName, string ErrorMessage, object? AttemptedValue = null);

public class ValidationResult
{
    public bool IsValid => Errors.Count == 0;
    public List<ValidationError> Errors { get; } = new();

    public ValidationResult() { }

    public ValidationResult(IEnumerable<ValidationError> errors)
    {
        Errors.AddRange(errors);
    }
}

public class ValidationException : Exception
{
    public IReadOnlyList<ValidationError> Errors { get; }

    public ValidationException(IEnumerable<ValidationError> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors.ToList().AsReadOnly();
    }

    public ValidationException(string propertyName, string errorMessage)
        : base(errorMessage)
    {
        Errors = new List<ValidationError> { new(propertyName, errorMessage) }.AsReadOnly();
    }
}

public interface IValidator<in T>
{
    ValidationResult Validate(T instance);
    Task<ValidationResult> ValidateAsync(T instance, CancellationToken ct = default);
}

public abstract class AbstractValidator<T> : IValidator<T>
{
    private readonly List<IPropertyRule<T>> _rules = new();

    public ValidationResult Validate(T instance)
    {
        var result = new ValidationResult();
        if (instance == null)
        {
            result.Errors.Add(new ValidationError(typeof(T).Name, "Instance cannot be null."));
            return result;
        }

        foreach (var rule in _rules)
        {
            rule.Execute(instance, result);
        }

        return result;
    }

    public Task<ValidationResult> ValidateAsync(T instance, CancellationToken ct = default)
    {
        return Task.FromResult(Validate(instance));
    }

    protected IRuleBuilder<T, TProperty> RuleFor<TProperty>(Expression<Func<T, TProperty>> propertyExpression)
    {
        var memberExpression = propertyExpression.Body as MemberExpression
            ?? (propertyExpression.Body as UnaryExpression)?.Operand as MemberExpression;

        var propertyName = memberExpression?.Member.Name ?? "Property";
        var compiledGetter = propertyExpression.Compile();

        var rule = new PropertyRule<T, TProperty>(propertyName, compiledGetter);
        _rules.Add(rule);
        return rule;
    }

    private interface IPropertyRule<in TTarget>
    {
        void Execute(TTarget instance, ValidationResult result);
    }

    public interface IRuleBuilder<TTarget, TProperty>
    {
        IRuleBuilder<TTarget, TProperty> NotEmpty(string? message = null);
        IRuleBuilder<TTarget, TProperty> NotNull(string? message = null);
        IRuleBuilder<TTarget, TProperty> GreaterThan(TProperty value, string? message = null);
        IRuleBuilder<TTarget, TProperty> LessThan(TProperty value, string? message = null);
        IRuleBuilder<TTarget, TProperty> Must(Func<TProperty, bool> predicate, string message);
        IRuleBuilder<TTarget, TProperty> Must(Func<TTarget, TProperty, bool> predicate, string message);
    }

    private class PropertyRule<TTarget, TProperty> : IPropertyRule<TTarget>, IRuleBuilder<TTarget, TProperty>
    {
        private readonly string _propertyName;
        private readonly Func<TTarget, TProperty> _getter;
        private readonly List<Func<TTarget, TProperty, ValidationError?>> _validators = new();

        public PropertyRule(string propertyName, Func<TTarget, TProperty> getter)
        {
            _propertyName = propertyName;
            _getter = getter;
        }

        public void Execute(TTarget instance, ValidationResult result)
        {
            var value = _getter(instance);
            foreach (var validator in _validators)
            {
                var error = validator(instance, value);
                if (error != null)
                {
                    result.Errors.Add(error);
                }
            }
        }

        public IRuleBuilder<TTarget, TProperty> NotEmpty(string? message = null)
        {
            _validators.Add((inst, val) =>
            {
                bool isDefaultOrEmpty = val switch
                {
                    null => true,
                    string s => string.IsNullOrWhiteSpace(s),
                    System.Collections.IEnumerable e => !e.GetEnumerator().MoveNext(),
                    _ => EqualityComparer<TProperty>.Default.Equals(val, default)
                };

                return isDefaultOrEmpty
                    ? new ValidationError(_propertyName, message ?? $"{_propertyName} must not be empty.", val)
                    : null;
            });
            return this;
        }

        public IRuleBuilder<TTarget, TProperty> NotNull(string? message = null)
        {
            _validators.Add((inst, val) =>
            {
                return val == null
                    ? new ValidationError(_propertyName, message ?? $"{_propertyName} must not be null.", val)
                    : null;
            });
            return this;
        }

        public IRuleBuilder<TTarget, TProperty> GreaterThan(TProperty value, string? message = null)
        {
            _validators.Add((inst, val) =>
            {
                if (val is IComparable<TProperty> comp && comp.CompareTo(value) <= 0)
                {
                    return new ValidationError(_propertyName, message ?? $"{_propertyName} must be greater than {value}.", val);
                }
                return null;
            });
            return this;
        }

        public IRuleBuilder<TTarget, TProperty> LessThan(TProperty value, string? message = null)
        {
            _validators.Add((inst, val) =>
            {
                if (val is IComparable<TProperty> comp && comp.CompareTo(value) >= 0)
                {
                    return new ValidationError(_propertyName, message ?? $"{_propertyName} must be less than {value}.", val);
                }
                return null;
            });
            return this;
        }

        public IRuleBuilder<TTarget, TProperty> Must(Func<TProperty, bool> predicate, string message)
        {
            _validators.Add((inst, val) =>
            {
                return !predicate(val)
                    ? new ValidationError(_propertyName, message, val)
                    : null;
            });
            return this;
        }

        public IRuleBuilder<TTarget, TProperty> Must(Func<TTarget, TProperty, bool> predicate, string message)
        {
            _validators.Add((inst, val) =>
            {
                return !predicate(inst, val)
                    ? new ValidationError(_propertyName, message, val)
                    : null;
            });
            return this;
        }
    }
}
