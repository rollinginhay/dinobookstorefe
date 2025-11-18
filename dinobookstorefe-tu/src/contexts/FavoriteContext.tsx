'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book } from '@/components/BookCard';

interface FavoriteContextType {
  favorites: Book[];
  addToFavorites: (book: Book) => void;
  removeFromFavorites: (bookId: number) => void;
  isFavorite: (bookId: number) => boolean;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Book[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (book: Book) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.find(item => item.id === book.id)) {
        return prevFavorites;
      }
      return [...prevFavorites, book];
    });
  };

  const removeFromFavorites = (bookId: number) => {
    setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== bookId));
  };

  const isFavorite = (bookId: number) => {
    return favorites.some(item => item.id === bookId);
  };

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  const context = useContext(FavoriteContext);
  if (context === undefined) {
    throw new Error('useFavorite must be used within a FavoriteProvider');
  }
  return context;
}


