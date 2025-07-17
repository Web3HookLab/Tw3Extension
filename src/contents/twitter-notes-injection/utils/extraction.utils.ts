/**
 * 用户信息提取工具函数
 * 从不同页面类型提取用户标识信息
 */

import { safeQuerySelector, safeQuerySelectorAll } from './dom.utils'
import type { UserIdentificationResult, PageType } from '../types/twitter-notes-injection.types'
import type { TwitterNote } from '~src/types/twitter-notes.types'

/**
 * 检查页面类型
 */
export function getPageType(): PageType {
  const pathname = location.pathname

  // 详细推文页面模式：/username/status/123456
  const isTweetDetailPattern = /^\/[^\/]+\/status\/\d+/.test(pathname)

  // 用户主页模式：/username 或 /username/ 或 /username/子页面
  // 支持子页面：with_replies, highlights, media, articles
  const isProfilePattern = /^\/[^\/]+(?:\/(with_replies|highlights|media|articles))?(?:\/)?$/.test(pathname)

  // 排除特殊页面
  const excludePatterns = [
    '/home', '/explore', '/notifications', '/messages',
    '/bookmarks', '/lists', '/profile', '/settings',
    '/i/', '/search', '/compose', '/login', '/signup'
  ]

  const isExcluded = excludePatterns.some(pattern => pathname.startsWith(pattern))

  if (isTweetDetailPattern) return 'tweet-detail'
  if (isProfilePattern && !isExcluded) return 'profile'
  if (pathname === '/home') return 'home'
  if (pathname.startsWith('/search')) return 'search'

  return 'other'
}

/**
 * 获取详细的页面类型信息
 */
export function getDetailedPageType(): {
  pageType: PageType
  isProfileWithTweets: boolean
  hasUserActions: boolean
  hasTweetList: boolean
} {
  const pageType = getPageType()
  const isProfile = pageType === 'profile'

  return {
    pageType,
    isProfileWithTweets: isProfile && document.querySelector('[data-testid="tweet"]') !== null,
    hasUserActions: document.querySelector('.css-175oi2r.r-obd0qt.r-18u37iz.r-1w6e6rj.r-1h0z5md.r-dnmrzs') !== null,
    hasTweetList: document.querySelector('[data-testid="User-Name"]') !== null
  }
}

/**
 * 检查是否为用户资料页面
 */
export function isUserProfilePage(): boolean {
  return getPageType() === 'profile'
}

/**
 * 检查是否为推文详情页面
 */
export function isTweetDetailPage(): boolean {
  return getPageType() === 'tweet-detail'
}

/**
 * 检查是否为支持的页面
 */
export function isSupportedPage(): boolean {
  return location.hostname.includes('x.com') || location.hostname.includes('twitter.com')
}

/**
 * 从推文详情页URL提取screen_name
 */
export function extractScreenNameFromTweetUrl(): string | null {
  const pathname = location.pathname
  const match = pathname.match(/^\/([^\/]+)\/status\/\d+/)
  return match ? match[1] : null
}



/**
 * 从用户主页提取rest_id
 */
export function extractRestIdFromProfile(): string | null {
  try {
    const jsonLDScripts = safeQuerySelectorAll('script[type="application/ld+json"]')
    
    for (const script of jsonLDScripts) {
      try {
        const data = JSON.parse(script.textContent || '')
        
        if (data['@type'] === 'ProfilePage' && 
            data.mainEntity && 
            data.mainEntity.identifier) {
          console.log('✅ 从用户主页提取到rest_id:', data.mainEntity.identifier)
          return data.mainEntity.identifier
        }
      } catch (parseError) {
        continue
      }
    }
    
    console.log('❌ 未能从用户主页提取rest_id')
    return null
  } catch (error) {
    console.error('❌ 提取用户主页rest_id时出错:', error)
    return null
  }
}

/**
 * 从推文元素提取screen_name
 */
export function extractScreenNameFromTweetElement(userNameElement: Element): string | null {
  try {
    console.log('🔍 开始从推文元素提取screen_name')

    // 确保在正确的推文容器内
    const tweetContainer = userNameElement.closest('article[data-testid="tweet"]')
    if (!tweetContainer) {
      console.log('❌ 未找到推文容器')
      return null
    }

    let screenName: string | null = null

    // 方法1: 从当前推文容器的用户名区域提取（最可靠）
    const userNameArea = tweetContainer.querySelector('[data-testid="User-Name"]')
    if (userNameArea) {
      const textElements = userNameArea.querySelectorAll('[dir="ltr"]')
      for (const textElement of textElements) {
        const textContent = textElement.textContent || ''
        const atMatch = textContent.match(/@([a-zA-Z0-9_]+)/)
        if (atMatch) {
          screenName = atMatch[1]
          // console.log('📊 从@用户名文本提取screen_name:', screenName)
          break
        }
      }

      // 如果文本提取失败，尝试从用户名区域的链接提取
      if (!screenName) {
        const userLinks = userNameArea.querySelectorAll('a[href^="/"]')
        for (const userLink of userLinks) {
          const href = userLink.getAttribute('href')
          const match = href?.match(/^\/([^\/\?]+)$/)
          if (match && !match[1].includes('status') && !match[1].includes('i/') && !match[1].includes('search')) {
            screenName = match[1]
            console.log('📊 从用户名区域链接提取screen_name:', screenName)
            break
          }
        }
      }
    }

    // 方法2: 从头像容器提取（备选方案，但需要严格验证）
    if (!screenName) {
      const avatarContainer = tweetContainer.querySelector('[data-testid^="UserAvatar-Container-"]')
      if (avatarContainer) {
        const testId = avatarContainer.getAttribute('data-testid')
        const extractedName = testId?.replace('UserAvatar-Container-', '') || null

        // 严格验证：确保这个名称确实属于当前推文的用户名区域
        if (extractedName && userNameArea) {
          const userNameText = userNameArea.textContent || ''
          if (userNameText.includes(`@${extractedName}`)) {
            screenName = extractedName
            console.log('📊 从头像容器提取screen_name:', screenName)
          }
        }
      }
    }

    if (!screenName) {
      console.log('❌ 无法从推文元素提取screen_name')
      return null
    }

    // 最终验证：确保提取的用户名符合Twitter用户名规范
    const isValidScreenName = /^[a-zA-Z0-9_]{1,15}$/.test(screenName)
    if (!isValidScreenName) {
      console.log('❌ 提取的screen_name不符合Twitter规范:', screenName)
      return null
    }

    // 最终验证：再次确保screen_name确实属于当前推文的用户名区域
    if (userNameArea) {
      const userNameText = userNameArea.textContent || ''
      if (!userNameText.includes(`@${screenName}`)) {
        console.log('❌ 最终验证失败，screen_name与用户名区域不匹配:', { screenName, userNameText })
        return null
      }
    } else {
      console.log('❌ 最终验证失败，未找到用户名区域')
      return null
    }

    console.log('✅ 成功提取并验证screen_name:', screenName)
    return screenName
  } catch (error) {
    console.error('❌ 提取screen_name时出错:', error)
    return null
  }
}

/**
 * 通过screen_name从本地缓存查找对应的备注
 */
export async function findNoteByScreenName(screenName: string, localNotes: TwitterNote[]): Promise<TwitterNote | null> {
  try {
    const matchingNote = localNotes.find(note => 
      note.screen_name?.toLowerCase() === screenName?.toLowerCase()
    )
    
    if (matchingNote) {
      console.log('✅ 找到匹配的备注:', { screenName, restId: matchingNote.twitter_rest_id })
      return matchingNote
    } else {
      console.log('📝 未找到匹配的备注:', screenName)
      return null
    }
  } catch (error) {
    console.error('❌ 查找备注时出错:', error)
    return null
  }
}

/**
 * 从推文元素提取用户信息（包含rest_id）
 */
export async function extractUserInfoFromTweetElement(
  userNameElement: Element, 
  localNotes: TwitterNote[]
): Promise<UserIdentificationResult | null> {
  try {
    const screenName = extractScreenNameFromTweetElement(userNameElement)
    if (!screenName) {
      return null
    }
    
    const matchingNote = await findNoteByScreenName(screenName, localNotes)
    if (!matchingNote) {
      return null
    }
    
    return {
      restId: matchingNote.twitter_rest_id,
      screenName: screenName,
      source: 'cache'
    }
  } catch (error) {
    console.error('❌ 提取推文用户信息时出错:', error)
    return null
  }
}

/**
 * 获取用户信息（统一入口）
 */
export async function getUserIdentification(
  element?: Element,
  localNotes: TwitterNote[] = []
): Promise<UserIdentificationResult | null> {
  const pageType = getPageType()
  
  switch (pageType) {
    case 'profile':
      const restId = extractRestIdFromProfile()
      if (restId) {
        // 从URL提取screen_name，处理子页面路径
        let screenName = location.pathname.slice(1) // 移除开头的 /
        // 如果是子页面，只取用户名部分
        const subPageMatch = screenName.match(/^([^\/]+)(?:\/(with_replies|highlights|media|articles))?/)
        if (subPageMatch) {
          screenName = subPageMatch[1]
        }

        return {
          restId,
          screenName,
          source: 'profile'
        }
      }
      break
      
    case 'tweet-detail':
      const screenName = extractScreenNameFromTweetUrl()
      if (screenName) {
        return {
          restId: '', // 详情页面无法直接获取restId，需要通过缓存匹配
          screenName,
          source: 'tweet'
        }
      }
      break

    case 'home':
    case 'search':
    case 'other':
      if (element) {
        return await extractUserInfoFromTweetElement(element, localNotes)
      }
      break
  }
  
  return null
}

/**
 * 检查是否有用户资料元素存在
 */
export function hasUserProfileElements(): boolean {
  const profileElements = [
    '[data-testid="UserName"]',
    '[data-testid="UserProfileHeader_Items"]',
    '[data-testid="UserJoinDate"]'
  ]
  
  return profileElements.some(selector => safeQuerySelector(selector) !== null)
}

/**
 * 查找推文中的用户名元素
 */
export function findTweetUserNameElements(): NodeListOf<Element> | [] {
  return safeQuerySelectorAll('[data-testid="User-Name"]')
}

/**
 * 查找用户主页的用户名容器
 */
export function findProfileUserNameContainer(): Element | null {
  // 方法1: 直接查找用户名容器
  const userNameElement = safeQuerySelector('[data-testid="UserName"]')
  if (userNameElement) {
    const displayNameElement = userNameElement.querySelector('div[dir="ltr"]')
    if (displayNameElement) {
      return displayNameElement.parentElement
    }
  }
  
  // 方法2: 从资料头部区域查找
  const profileHeader = safeQuerySelector('[data-testid="UserProfileHeader_Items"]')
  if (profileHeader) {
    const nameContainers = profileHeader.querySelectorAll('div[dir="ltr"]')
    for (const container of nameContainers) {
      const textContent = container.textContent || ''
      if (textContent.length > 0 && !textContent.startsWith('@') && container.children.length === 0) {
        return container.parentElement
      }
    }
  }
  
  return null
}
