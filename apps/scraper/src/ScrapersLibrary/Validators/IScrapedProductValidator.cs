using System;
using ScrapersLibrary.Scrapers;

namespace ScrapersLibrary.Validators;

public interface IScrapedProductValidator
{
    bool Validate(ScrapedProduct product);
}
