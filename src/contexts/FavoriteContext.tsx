'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book } from '@/components/BookCard';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  id: number;
  name?: string;
}

interface FavoriteContextType {
  favorites: Book[];
  addToFavorites: (book: Book) => void;
  removeFromFavorites: (bookId: number) => void;
  isFavorite: (bookId: number) => boolean;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export function FavoriteProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Lấy token & decode userId
  useEffect(() => {
    const t = localStorage.getItem("jwtToken");
    if (!t) {
      setToken(null);
      setUserId(null);
      setFavorites([]); // Xóa yêu thích khi không có token
      return;
    }
    setToken(t);
    try {
      const decoded = jwtDecode<JwtPayload>(t);
      if (decoded.id) {
        setUserId(decoded.id);
        // Load favorites từ localStorage với key theo userId
        const savedFavorites = localStorage.getItem(`favorites_${decoded.id}`);
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        } else {
          setFavorites([]);
        }
      }
    } catch (err) {
      console.error("Invalid token", err);
      setToken(null);
      setUserId(null);
      setFavorites([]);
    }
  }, []);

  // Lắng nghe thay đổi token (khi đăng nhập/đăng xuất)
  useEffect(() => {
    const handleStorageChange = () => {
      const t = localStorage.getItem("jwtToken");
      if (!t) {
        setToken(null);
        setUserId(null);
        setFavorites([]);
      } else {
        try {
          const decoded = jwtDecode<JwtPayload>(t);
          if (decoded.id) {
            setToken(t);
            setUserId(decoded.id);
            const savedFavorites = localStorage.getItem(`favorites_${decoded.id}`);
            if (savedFavorites) {
              setFavorites(JSON.parse(savedFavorites));
            } else {
              setFavorites([]);
            }
          }
        } catch (err) {
          console.error("Invalid token", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Kiểm tra token mỗi giây để phát hiện đăng xuất (vì storage event không fire trên cùng tab)
    const interval = setInterval(() => {
      const t = localStorage.getItem("jwtToken");
      if (!t && token) {
        // Token bị xóa (đăng xuất)
        handleStorageChange();
      } else if (t && !token) {
        // Token mới xuất hiện (đăng nhập)
        handleStorageChange();
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);

  // Save favorites to localStorage với key theo userId
  useEffect(() => {
    if (userId && token) {
      localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
    }
  }, [favorites, userId, token]);

  const addToFavorites = (book: Book) => {
    // Kiểm tra đăng nhập
    if (!token || !userId) {
      return; // Không làm gì nếu chưa đăng nhập
    }
    setFavorites(prevFavorites => {
      if (prevFavorites.find(item => item.id === book.id)) {
        return prevFavorites;
      }
      return [...prevFavorites, book];
    });
  };

  const removeFromFavorites = (bookId: number) => {
    // Kiểm tra đăng nhập
    if (!token || !userId) {
      return; // Không làm gì nếu chưa đăng nhập
    }
    setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== bookId));
  };

  const isFavorite = (bookId: number) => {
    if (!token || !userId) {
      return false; // Không có yêu thích nếu chưa đăng nhập
    }
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


