FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY apps/scraper/src/Worker/Worker.csproj apps/scraper/src/Worker/
COPY apps/scraper/src/ScrapersLibrary/ScrapersLibrary.csproj apps/scraper/src/ScrapersLibrary/
RUN dotnet restore apps/scraper/src/Worker/Worker.csproj
COPY . ./
RUN dotnet publish apps/scraper/src/Worker/Worker.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/playwright/dotnet:v1.64.1-noble AS runtime
WORKDIR /app
COPY --from=build /app/publish ./
EXPOSE 8080
ENTRYPOINT ["dotnet", "Worker.dll"]
