/**
 * 地址验证Hook
 */

import { useState, useCallback, useMemo } from 'react';
import type { UseAddressValidationReturn, AddressValidation } from '~src/types/addressSearch.types';
import { validateAddress } from '../utils/addressValidation';

export const useAddressValidation = (initialAddress: string = ''): UseAddressValidationReturn => {
  const [address, setAddress] = useState(initialAddress);

  // 验证当前地址
  const validation = useMemo((): AddressValidation => {
    return validateAddress(address);
  }, [address]);

  // 验证指定地址
  const validateSpecificAddress = useCallback((targetAddress: string): AddressValidation => {
    return validateAddress(targetAddress);
  }, []);

  return {
    validation,
    validateAddress: validateSpecificAddress
  };
};
