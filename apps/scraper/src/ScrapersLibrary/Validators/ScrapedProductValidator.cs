using System.Globalization;
using Microsoft.Extensions.Logging;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Validators;

public sealed class ScrapedProductValidator(
    ILogger<ScrapedProductValidator> logger) : IScrapedProductValidator
{
    private const int MaximumReasonLength = 255;

    private static readonly HashSet<string> Iso4217CurrencyCodes = CultureInfo
        .GetCultures(CultureTypes.SpecificCultures)
        .Select(culture => new RegionInfo(culture.Name).ISOCurrencySymbol)
        .ToHashSet(StringComparer.Ordinal);

    public bool Validate(ScrapedProduct product)
    {
        ArgumentNullException.ThrowIfNull(product);

        ValidateRequiredPersistenceFields(product);

        var issues = new List<string>();

        if (!Uri.TryCreate(product.Url, UriKind.Absolute, out var productUri) ||
            (productUri.Scheme != Uri.UriSchemeHttp && productUri.Scheme != Uri.UriSchemeHttps))
        {
            issues.Add("The product URL must use HTTP or HTTPS.");
        }

        if (product.DataState != ScrapedProductStatus.ERROR_CAPTURA &&
            !Iso4217CurrencyCodes.Contains(product.CurrencyCode))
        {
            issues.Add("The currency code must be a supported ISO 4217 code.");
        }

        switch (product.DataState)
        {
            case ScrapedProductStatus.DATO_VALIDO:
                ValidateValidData(product, issues);
                break;
            case ScrapedProductStatus.AGOTADO:
            case ScrapedProductStatus.SIN_DATO:
                ValidateMissingData(product, issues);
                break;
            case ScrapedProductStatus.ERROR_CAPTURA:
                ValidateCaptureError(product, issues);
                break;
            default:
                issues.Add("The data state is not supported.");
                break;
        }

        if (issues.Count > 0)
        {
            MarkAsCaptureError(product, issues);
            logger.LogWarning(
                "Scraped product {CanonicalProductId} from store {StoreId} at {ProductUrl} failed validation. " +
                "State: {DataState}. Issues: {ValidationIssues}",
                product.CanonicalProductId,
                product.StoreId,
                product.Url,
                product.DataState,
                string.Join(" ", issues));
            return false;
        }

        if (product.DataState == ScrapedProductStatus.ERROR_CAPTURA)
        {
            logger.LogWarning(
                "Scraped product {CanonicalProductId} from store {StoreId} at {ProductUrl} has a capture error: {CaptureError}",
                product.CanonicalProductId,
                product.StoreId,
                product.Url,
                product.Error);
            return false;
        }

        logger.LogDebug(
            "Scraped product {CanonicalProductId} from store {StoreId} at {ProductUrl} passed validation with state {DataState}",
            product.CanonicalProductId,
            product.StoreId,
            product.Url,
            product.DataState);
        return true;
    }

    private static void ValidateRequiredPersistenceFields(ScrapedProduct product)
    {
        if (product.CapturedAt == default || product.CapturedAt.Kind != DateTimeKind.Utc)
        {
            throw new ArgumentException("A scraped product must have a UTC capture timestamp.", nameof(product));
        }

        if (product.CanonicalProductId == Guid.Empty ||
            product.StoreId == Guid.Empty ||
            product.AliasStoreId == Guid.Empty)
        {
            throw new ArgumentException(
                "A scraped product must have canonical product, store, and store alias IDs.",
                nameof(product));
        }
    }

    private static void ValidateValidData(ScrapedProduct product, ICollection<string> issues)
    {
        if (!product.Available)
        {
            issues.Add("A valid data record must be available.");
        }

        if (product.RegularPrice is not > 0)
        {
            issues.Add("A valid data record must have a positive regular price.");
        }

        if (product.PromoPrice is { } promoPrice &&
            (promoPrice <= 0 ||
             product.RegularPrice is not { } regularPrice ||
             promoPrice >= regularPrice))
        {
            issues.Add("A promotional price must be positive and be lower than the regular price.");
        }

        if (product.UnitPrice is { } unitPrice &&
            (unitPrice <= 0))
        {
            issues.Add("A unit price must be positive.");
        }
    }

    private static void ValidateMissingData(ScrapedProduct product, ICollection<string> issues)
    {
        if (product.Available)
        {
            issues.Add("A missing-data record must not be marked as available.");
        }

        if (HasAnyPrice(product))
        {
            issues.Add("A missing-data record must not contain prices.");
        }
    }

    private static void ValidateCaptureError(ScrapedProduct product, ICollection<string> issues)
    {
        if (product.Available)
        {
            issues.Add("A capture-error record must not be marked as available.");
        }

        if (HasAnyPrice(product))
        {
            issues.Add("A capture-error record must not contain prices.");
        }
    }

    private static bool HasAnyPrice(ScrapedProduct product) =>
        product.RegularPrice.HasValue ||
        product.PromoPrice.HasValue ||
        product.UnitPrice.HasValue;

    private static bool FitsNumeric(decimal value, int precision, int scale)
    {
        if (precision <= scale)
        {
            return false;
        }

        decimal integerLimit = 1;
        for (var i = 0; i < precision - scale; i++)
        {
            integerLimit *= 10;
        }

        return value < integerLimit && decimal.Round(value, scale) == value;
    }

    private static void MarkAsCaptureError(ScrapedProduct product, IReadOnlyCollection<string> issues)
    {
        var reason = string.IsNullOrWhiteSpace(product.Error)
            ? string.Join(" ", issues)
            : $"{product.Error.Trim()} {string.Join(" ", issues)}";

        product.Error = reason.Length <= MaximumReasonLength
            ? reason
            : reason[..MaximumReasonLength];
    }
}
