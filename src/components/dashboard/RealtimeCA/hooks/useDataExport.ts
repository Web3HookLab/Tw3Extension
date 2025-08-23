import { useCallback } from 'react';
import type { CAEvent } from '~src/types/realtime-ca.types';

interface ExportOptions {
  format: 'json' | 'csv';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface UseDataExportReturn {
  exportData: (events: CAEvent[], options: ExportOptions) => void;
  exportToClipboard: (events: CAEvent[], format: 'json' | 'csv') => Promise<boolean>;
}

export function useDataExport(): UseDataExportReturn {
  // 过滤日期范围
  const filterByDateRange = useCallback((events: CAEvent[], dateRange?: { start: Date; end: Date }) => {
    if (!dateRange) return events;
    
    const { start, end } = dateRange;
    return events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= start && eventDate <= end;
    });
  }, []);

  // 转换为CSV格式
  const convertToCSV = useCallback((events: CAEvent[], includeMetadata: boolean = false) => {
    if (events.length === 0) return '';
    
    // CSV头部
    const headers = [
      'Timestamp',
      'User Name',
      'Screen Name', 
      'Followers Count',
      'Tweet Content',
      'Token Symbol',
      'Token Address',
      'Network',
      'Total Mentions',
      'Unique Users',
      'Pump Launches',
      'Raydium Launches'
    ];
    
    if (includeMetadata) {
      headers.push('CA Today Count', 'CA 7Days Count', 'CA Total Count');
    }
    
    let csvContent = headers.join(',') + '\n';
    
    events.forEach(event => {
      const { user, tweet, mentions, network } = event.data;
      const primaryToken = mentions[0];
      
      if (!primaryToken) return;
      
      const row = [
        `"${event.timestamp}"`,
        `"${user.name.replace(/"/g, '""')}"`,
        `"${user.screen_name}"`,
        user.followers_count,
        `"${tweet.content.replace(/"/g, '""')}"`,
        `"${primaryToken.symbol}"`,
        `"${primaryToken.address}"`,
        `"${network.join(', ')}"`,
        primaryToken.mention_stats.total_mentions,
        primaryToken.mention_stats.unique_users,
        event.data.ca_event.pump.launch_count,
        event.data.ca_event.raydium.launch_count
      ];
      
      if (includeMetadata) {
        row.push(
          event.data.ca_stats.today.count,
          event.data.ca_stats.last_7_days.count,
          event.data.ca_stats.total.count
        );
      }
      
      csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
  }, []);
  
  // 导出数据到文件
  const exportData = useCallback((events: CAEvent[], options: ExportOptions) => {
    try {
      // 过滤日期范围
      const filteredEvents = filterByDateRange(events, options.dateRange);
      
      if (filteredEvents.length === 0) {
        alert('没有数据可导出');
        return;
      }
      
      let content: string;
      let filename: string;
      let mimeType: string;
      
      if (options.format === 'csv') {
        content = convertToCSV(filteredEvents, options.includeMetadata);
        filename = `realtime-ca-events-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
      } else {
        // JSON格式
        const exportData = {
          exportTime: new Date().toISOString(),
          totalEvents: filteredEvents.length,
          dateRange: options.dateRange,
          events: options.includeMetadata ? filteredEvents : filteredEvents.map(event => ({
            timestamp: event.timestamp,
            user: {
              name: event.data.user.name,
              screen_name: event.data.user.screen_name,
              followers_count: event.data.user.followers_count
            },
            tweet: {
              content: event.data.tweet.content,
              created_at: event.data.tweet.created_at
            },
            mentions: event.data.mentions.map(token => ({
              symbol: token.symbol,
              address: token.address,
              network_type: token.network_type,
              mention_stats: token.mention_stats
            })),
            network: event.data.network
          }))
        };
        
        content = JSON.stringify(exportData, null, 2);
        filename = `realtime-ca-events-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json;charset=utf-8;';
      }
      
      // 创建下载链接
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`✅ Exported ${filteredEvents.length} events to ${filename}`);
      } else {
        // 降级方案：复制到剪贴板
        navigator.clipboard.writeText(content).then(() => {
          alert(`数据已复制到剪贴板 (${filteredEvents.length} 条记录)`);
        }).catch(() => {
          alert('导出失败，请检查浏览器权限');
        });
      }
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('导出失败，请稍后重试');
    }
  }, [convertToCSV, filterByDateRange]);
  
  // 导出到剪贴板
  const exportToClipboard = useCallback(async (events: CAEvent[], format: 'json' | 'csv'): Promise<boolean> => {
    try {
      let content: string;
      
      if (format === 'csv') {
        content = convertToCSV(events, false);
      } else {
        content = JSON.stringify(events, null, 2);
      }
      
      await navigator.clipboard.writeText(content);
      console.log(`✅ Copied ${events.length} events to clipboard as ${format.toUpperCase()}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to copy to clipboard:', error);
      return false;
    }
  }, [convertToCSV]);
  
  return {
    exportData,
    exportToClipboard
  };
}
