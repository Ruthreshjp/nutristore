import React, { createContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState(100000);
  const [quantityRange, setQuantityRange] = useState(1000);
  const [harvestFilter, setHarvestFilter] = useState('');
  const [offerOnly, setOfferOnly] = useState(false);
  const [expiryDateBefore, setExpiryDateBefore] = useState('');

  const location = useLocation();

  // Fetch products and initialize with URL query
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    setSearchTerm(query);

    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        const validProducts = data.filter(p => p.itemName && p.image && p.quantity > 0);
        setProducts(validProducts);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, [location]);

  // Apply filters whenever relevant states change
  useEffect(() => {
    const filtered = products.filter(product => {
      const matchSearch = product.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPrice = product.price <= priceRange;
      const matchQty = product.quantity <= quantityRange;
      const matchHarvest =
        harvestFilter === ''
          ? true
          : harvestFilter === 'harvested'
          ? product.harvestCondition === 'harvested'
          : product.harvestCondition !== 'harvested';
      const matchOffer = offerOnly ? product.offers?.trim() !== '' : true;
      const matchExpiry = expiryDateBefore
        ? new Date(product.expiryDate) <= new Date(expiryDateBefore)
        : true;

      return matchSearch && matchPrice && matchQty && matchHarvest && matchOffer && matchExpiry;
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange, quantityRange, harvestFilter, offerOnly, expiryDateBefore]);

  const maxPrice = useMemo(() => {
    return products.reduce((max, p) => (p.price > max ? p.price : max), 1);
  }, [products]);

  const maxQuantity = useMemo(() => {
    return products.reduce((max, p) => (p.quantity > max ? p.quantity : max), 1);
  }, [products]);

  const clearFilters = () => {
    setPriceRange(maxPrice);
    setQuantityRange(maxQuantity);
    setHarvestFilter('');
    setOfferOnly(false);
    setExpiryDateBefore('');
    setSearchTerm('');
    setFilteredProducts(products);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        setProducts,
        filteredProducts,
        setFilteredProducts,
        loading,
        searchTerm,
        setSearchTerm,
        priceRange,
        setPriceRange,
        quantityRange,
        setQuantityRange,
        harvestFilter,
        setHarvestFilter,
        offerOnly,
        setOfferOnly,
        expiryDateBefore,
        setExpiryDateBefore,
        maxPrice,
        maxQuantity,
        clearFilters,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};