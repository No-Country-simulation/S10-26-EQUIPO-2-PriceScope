namespace ScrapersLibrary;

public enum ScrapedProductStatus
{
    DATO_VALIDO,
    AGOTADO,
    ERROR_CAPTURA,
    SIN_DATO
}

public enum ScrapeRunStatus
{
    PENDIENTE,
    EN_PROCESO,
    EXITOSA,
    ADVERTENCIA,
    FALLIDA,
    ABORTADA
}
