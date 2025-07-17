import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface OpenSidePanelRequest {
  type: string
  title: string
  restId?: string
  walletAddress?: string
  userData?: any
}

export interface OpenSidePanelResponse {
  success: boolean
  error?: string
  tabId?: number
}

const handler: PlasmoMessaging.MessageHandler<OpenSidePanelRequest, OpenSidePanelResponse> = async (req, res) => {
  console.log('🔄 后台：处理侧边栏打开请求:', req.body);

  try {
    const { type, title, restId, walletAddress, userData } = req.body;

    // 验证请求参数 - 钱包备注类型使用walletAddress，其他类型使用restId
    const identifier = walletAddress || restId;
    if (!type || !title || !identifier) {
      console.error('❌ 侧边栏请求参数不完整:', { type, title, restId, walletAddress });
      res.send({
        success: false,
        error: '请求参数不完整'
      });
      return;
    }

    // 检查SidePanel API是否可用
    if (!chrome.sidePanel) {
      console.error('❌ SidePanel API不可用');
      res.send({
        success: false,
        error: 'SidePanel功能不可用，请更新Chrome浏览器'
      });
      return;
    }

    // 获取发送消息的标签页信息
    const tab = req.sender?.tab;
    const tabId = tab?.id;

    if (!tabId) {
      console.error('❌ 未找到有效的标签页ID');
      res.send({
        success: false,
        error: '未找到有效的标签页ID'
      });
      return;
    }

    console.log('📍 发送方标签页信息:', { tabId, windowId: tab?.windowId });

    // 准备侧边栏数据 - 混合模式：本地数据直接传递，API数据只传递restId
    const sidePanelData = {
      type,
      title,
      restId: restId || walletAddress,  // 兼容钱包备注类型
      walletAddress,  // 钱包备注专用字段
      userData: userData || null  // 本地数据类型直接传递userData
    };

    // 立即打开侧边栏 - 必须在用户手势上下文中同步调用
    console.log('🔄 正在为标签页打开侧边栏:', tabId);
    chrome.sidePanel.open({ tabId }); // 不使用 await，保持用户手势上下文
    console.log('✅ 侧边栏打开请求已发送');

    // 给侧边栏更多时间来初始化，然后重试发送消息
    const sendDataWithRetry = (attempt = 1, maxAttempts = 5) => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'SIDE_PANEL_DATA',
          data: sidePanelData,
          targetTabId: tabId // 添加目标标签页ID，确保数据发送给正确的侧边栏
        }).then(() => {
          console.log('✅ 数据消息发送成功，目标标签页:', tabId);
        }).catch(err => {
          console.log(`📝 数据消息发送失败 (尝试 ${attempt}/${maxAttempts}):`, err.message);

          // 如果还有重试次数，继续重试
          if (attempt < maxAttempts) {
            sendDataWithRetry(attempt + 1, maxAttempts);
          } else {
            console.warn('❌ 数据消息发送最终失败，已达到最大重试次数');
          }
        });
      }, attempt * 200); // 递增延迟：200ms, 400ms, 600ms...
    };

    sendDataWithRetry();

    res.send({
      success: true,
      tabId
    });
  } catch (error) {
    console.error('❌ 处理侧边栏打开请求失败:', error);
    res.send({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}

export default handler
