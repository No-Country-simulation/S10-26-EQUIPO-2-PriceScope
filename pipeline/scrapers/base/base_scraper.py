from abc import ABC, abstractmethod


class BaseScraper(ABC):
    """Base mínima para scrapers."""

    @abstractmethod
    def fetch(self):
        """Obtiene datos de la fuente."""

    @abstractmethod
    def parse(self, raw_data):
        """Transforma datos crudos en estructura utilizable."""
