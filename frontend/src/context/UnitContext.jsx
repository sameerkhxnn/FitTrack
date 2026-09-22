import React, { createContext, useContext, useState, useEffect } from 'react';

const UnitContext = createContext(null);

export const UnitProvider = ({ children }) => {
  const [unitSystem, setUnitSystem] = useState(() => {
    return localStorage.getItem('fittrack_units') || 'metric';
  });

  useEffect(() => {
    localStorage.setItem('fittrack_units', unitSystem);
  }, [unitSystem]);

  const toggleUnitSystem = () => {
    setUnitSystem((prev) => (prev === 'metric' ? 'imperial' : 'metric'));
  };

  const formatWeight = (kgVal, showUnit = true) => {
    if (kgVal === null || kgVal === undefined) return '--';
    if (unitSystem === 'imperial') {
      const lbs = (kgVal * 2.20462).toFixed(1);
      return showUnit ? `${lbs} lbs` : lbs;
    }
    return showUnit ? `${kgVal} kg` : kgVal;
  };

  const formatHeight = (cmVal) => {
    if (!cmVal) return '--';
    if (unitSystem === 'imperial') {
      const totalInches = cmVal / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}' ${inches}"`;
    }
    return `${cmVal} cm`;
  };

  const formatCircumference = (cmVal, showUnit = true) => {
    if (cmVal === null || cmVal === undefined) return '--';
    if (unitSystem === 'imperial') {
      const inches = (cmVal / 2.54).toFixed(1);
      return showUnit ? `${inches} in` : inches;
    }
    return showUnit ? `${cmVal} cm` : cmVal;
  };

  const weightUnit = unitSystem === 'imperial' ? 'lbs' : 'kg';
  const lengthUnit = unitSystem === 'imperial' ? 'in' : 'cm';

  return (
    <UnitContext.Provider
      value={{
        unitSystem,
        setUnitSystem,
        toggleUnitSystem,
        formatWeight,
        formatHeight,
        formatCircumference,
        weightUnit,
        lengthUnit,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
};

export const useUnits = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnits must be used within a UnitProvider');
  }
  return context;
};
