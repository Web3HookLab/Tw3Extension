/**
 * CA地址搜索API服务
 */

import { TokenManager } from '~src/services/token.service';
import { API_CONFIG } from '~src/config/config';
import { ADDRESS_SEARCH_CONSTANTS } from '~src/types/addressSearch.types';
import type {
  AddressSearchRequest,
  AddressSearchResponse,
  AddressSearchData,
  AddressSearchError
} from '~src/types/addressSearch.types';


export class AddressSearchService {
  /**
   * 获取认证头信息
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('未找到用户认证信息，请先登录');
      }

      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Tw3Track-Extension/1.0'
      };
    } catch (error) {
      console.error('❌ 获取认证信息失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户权限
   */
  private static async checkPermission(): Promise<void> {
    try {
      const userInfo = await TokenManager.getUserInfo();
      
      if (!userInfo) {
        throw new Error('用户信息不存在，请重新登录');
      }

      if (userInfo.plan === 'Free') {
        throw new Error('此功能仅对会员用户开放，请升级您的订阅计划');
      }
    } catch (error) {
      console.error('❌ 权限检查失败:', error);
      throw error;
    }
  }

  /**
   * 处理API错误响应
   */
  private static handleApiError(response: Response, data?: any): never {
    const { status, statusText } = response;

    let errorMessage = `HTTP ${status}: ${statusText}`;
    let errorCode = status;

    if (data && data.msg) {
      errorMessage = data.msg;
      errorCode = data.code || status;
    }

    switch (status) {
      case 401:
        errorMessage = '认证失败，请重新登录';
        break;
      case 403:
        errorMessage = '权限不足，此功能仅对会员用户开放';
        break;
      case 400:
        errorMessage = data?.msg || '请求参数错误，请检查地址格式';
        break;
      case 429:
        errorMessage = '请求过于频繁，请稍后再试';
        break;
      case 500:
        errorMessage = '服务器内部错误，请稍后重试';
        break;
      case 502:
      case 503:
      case 504:
        errorMessage = '服务暂时不可用，请稍后重试';
        break;
    }

    const error = new Error(errorMessage) as AddressSearchError;
    error.name = 'AddressSearchError';
    error.code = errorCode;
    
    throw error;
  }

  /**
   * 验证请求参数
   */
  private static validateRequest(request: AddressSearchRequest): void {
    if (!request.solana_address && !request.eth_address) {
      throw new Error('至少需要提供一个地址（Solana或Ethereum）');
    }

    // 验证Solana地址格式
    if (request.solana_address) {
      const solanaAddress = request.solana_address.trim();
      if (!solanaAddress || 
          solanaAddress.length < ADDRESS_SEARCH_CONSTANTS.SOLANA.MIN_LENGTH ||
          solanaAddress.length > ADDRESS_SEARCH_CONSTANTS.SOLANA.MAX_LENGTH) {
        throw new Error('Solana地址格式不正确');
      }
    }

    // 验证Ethereum地址格式
    if (request.eth_address) {
      const ethAddress = request.eth_address.trim();
      if (!ethAddress || 
          !ADDRESS_SEARCH_CONSTANTS.ETHEREUM.HEX_REGEX.test(ethAddress)) {
        throw new Error('Ethereum地址格式不正确');
      }
    }
  }

  /**
   * 搜索地址相关推文
   */
  static async searchAddressTweets(request: AddressSearchRequest): Promise<AddressSearchData> {
    try {
      console.log('🔍 开始搜索地址推文:', request);

      // 验证请求参数
      this.validateRequest(request);

      // 检查用户权限
      await this.checkPermission();

      // 获取认证头
      const headers = await this.getAuthHeaders();

      // 构建API URL
      const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.CA_ADDRESS_SEARCH}`;

      console.log('📡 发送API请求:', { apiUrl, request });

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.CA_SEARCH_TIMEOUT
      );

      try {
        // 发送请求
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 API响应: ${response.status} ${response.statusText}`);

        // 解析响应数据
        let responseData: AddressSearchResponse;
        try {
          responseData = await response.json();
        } catch (parseError) {
          console.error('❌ 解析响应数据失败:', parseError);
          throw new Error('服务器响应格式错误');
        }

        // 检查HTTP状态
        if (!response.ok) {
          this.handleApiError(response, responseData);
        }

        // 检查业务状态码
        if (responseData.code !== 200) {
          const error = new Error(responseData.msg || '搜索失败') as AddressSearchError;
          error.name = 'AddressSearchError';
          error.code = responseData.code;
          throw error;
        }

        console.log('✅ 搜索成功:', {
          totalTweets: responseData.data.stats.total_tweets,
          activeTweets: responseData.data.stats.active_tweets,
          tweetsCount: responseData.data.tweets.length
        });

        return responseData.data;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('请求超时，请检查网络连接后重试');
        }
        
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ 搜索地址推文失败:', error);
      
      // 重新抛出已知的业务错误
      if (error instanceof Error && error.name === 'AddressSearchError') {
        throw error;
      }
      
      // 包装未知错误
      const wrappedError = new Error(
        error instanceof Error ? error.message : '搜索失败，请稍后重试'
      ) as AddressSearchError;
      wrappedError.name = 'AddressSearchError';
      wrappedError.originalError = error instanceof Error ? error : undefined;
      
      throw wrappedError;
    }
  }

  /**
   * 搜索单个Solana地址
   */
  static async searchSolanaAddress(address: string): Promise<AddressSearchData> {
    return this.searchAddressTweets({ solana_address: address });
  }

  /**
   * 搜索单个Ethereum地址
   */
  static async searchEthereumAddress(address: string): Promise<AddressSearchData> {
    return this.searchAddressTweets({ eth_address: address });
  }

  /**
   * 搜索多个地址
   */
  static async searchMultipleAddresses(
    solanaAddress?: string,
    ethereumAddress?: string
  ): Promise<AddressSearchData> {
    const request: AddressSearchRequest = {};
    
    if (solanaAddress) {
      request.solana_address = solanaAddress;
    }
    
    if (ethereumAddress) {
      request.eth_address = ethereumAddress;
    }

    return this.searchAddressTweets(request);
  }

  /**
   * 检查服务可用性
   */
  static async checkServiceHealth(): Promise<boolean> {
    try {
      // 这里可以实现一个简单的健康检查
      // 暂时通过检查认证状态来判断
      await this.getAuthHeaders();
      return true;
    } catch (error) {
      console.warn('⚠️ 服务健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取搜索限制信息
   */
  static getSearchLimits() {
    return {
      maxTweetsPerRequest: 500,
      requestTimeout: API_CONFIG.CA_SEARCH_TIMEOUT,
      supportedNetworks: ['solana', 'ethereum'],
      requiresSubscription: true
    };
  }
}
