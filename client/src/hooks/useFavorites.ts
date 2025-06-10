import { useState, useEffect, useCallback } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('favoriteModels');
      if (stored) {
        const favoriteArray = JSON.parse(stored);
        setFavorites(new Set(favoriteArray));
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem('favoriteModels', JSON.stringify(Array.from(newFavorites)));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, []);

  const toggleFavorite = useCallback((modelId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(modelId)) {
      newFavorites.delete(modelId);
    } else {
      newFavorites.add(modelId);
    }
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const isFavorite = useCallback((modelId: string) => {
    return favorites.has(modelId);
  }, [favorites]);

  const getFavoriteModels = useCallback((allModels: any[]) => {
    return allModels.filter(model => favorites.has(model.id));
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavoriteModels,
    favoriteCount: favorites.size
  };
} 