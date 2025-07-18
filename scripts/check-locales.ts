#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';

interface LocaleData {
  [key: string]: any;
}

// 颜色输出函数
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

// 递归获取所有键路径
function getAllKeys(obj: any, prefix: string = ''): string[] {
  const keys: string[] = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// 检查缺失的键
function findMissingKeys(source: LocaleData, target: LocaleData): string[] {
  const sourceKeys = getAllKeys(source);
  const targetKeys = new Set(getAllKeys(target));
  
  return sourceKeys.filter(key => !targetKeys.has(key));
}

// 检查多余的键
function findExtraKeys(source: LocaleData, target: LocaleData): string[] {
  const sourceKeys = new Set(getAllKeys(source));
  const targetKeys = getAllKeys(target);
  
  return targetKeys.filter(key => !sourceKeys.has(key));
}

// 检查空值
function findEmptyValues(obj: LocaleData): string[] {
  const keys = getAllKeys(obj);
  return keys.filter(key => {
    const value = getNestedValue(obj, key);
    return value === '' || value === null || value === undefined;
  });
}

// 主函数
function main() {
  try {
    console.log(colors.bold(colors.cyan('🔍 Locale Files Comparison Tool\n')));
    
    // 读取文件
    const zhPath = join(process.cwd(), 'src/locales/zh.json');
    const enPath = join(process.cwd(), 'src/locales/en.json');
    
    console.log(`📁 Reading files:`);
    console.log(`   Chinese: ${zhPath}`);
    console.log(`   English: ${enPath}\n`);
    
    const zhData: LocaleData = JSON.parse(readFileSync(zhPath, 'utf-8'));
    const enData: LocaleData = JSON.parse(readFileSync(enPath, 'utf-8'));
    
    // 统计信息
    const zhKeys = getAllKeys(zhData);
    const enKeys = getAllKeys(enData);
    
    console.log(colors.bold('📊 Statistics:'));
    console.log(`   Chinese keys: ${colors.yellow(zhKeys.length.toString())}`);
    console.log(`   English keys: ${colors.yellow(enKeys.length.toString())}`);
    console.log(`   Difference: ${colors.yellow((zhKeys.length - enKeys.length).toString())}\n`);
    
    // 检查缺失的键（英文中缺少的中文键）
    const missingInEn = findMissingKeys(zhData, enData);
    if (missingInEn.length > 0) {
      console.log(colors.bold(colors.red(`❌ Missing in English (${missingInEn.length} keys):`)));
      missingInEn.forEach(key => {
        const zhValue = getNestedValue(zhData, key);
        console.log(`   ${colors.red('•')} ${colors.yellow(key)}: "${colors.cyan(zhValue)}"`);
      });
      console.log();
    } else {
      console.log(colors.green('✅ No missing keys in English\n'));
    }
    
    // 检查多余的键（英文中多出的键）
    const extraInEn = findExtraKeys(zhData, enData);
    if (extraInEn.length > 0) {
      console.log(colors.bold(colors.yellow(`⚠️  Extra in English (${extraInEn.length} keys):`)));
      extraInEn.forEach(key => {
        const enValue = getNestedValue(enData, key);
        console.log(`   ${colors.yellow('•')} ${colors.yellow(key)}: "${colors.cyan(enValue)}"`);
      });
      console.log();
    } else {
      console.log(colors.green('✅ No extra keys in English\n'));
    }
    
    // 检查空值
    const emptyInZh = findEmptyValues(zhData);
    const emptyInEn = findEmptyValues(enData);
    
    if (emptyInZh.length > 0) {
      console.log(colors.bold(colors.red(`🚫 Empty values in Chinese (${emptyInZh.length} keys):`)));
      emptyInZh.forEach(key => {
        console.log(`   ${colors.red('•')} ${colors.yellow(key)}`);
      });
      console.log();
    }
    
    if (emptyInEn.length > 0) {
      console.log(colors.bold(colors.red(`🚫 Empty values in English (${emptyInEn.length} keys):`)));
      emptyInEn.forEach(key => {
        console.log(`   ${colors.red('•')} ${colors.yellow(key)}`);
      });
      console.log();
    }
    
    // 总结
    console.log(colors.bold('📋 Summary:'));
    if (missingInEn.length === 0 && extraInEn.length === 0 && emptyInZh.length === 0 && emptyInEn.length === 0) {
      console.log(colors.green('🎉 All locale files are in perfect sync!'));
    } else {
      console.log(colors.yellow('⚠️  Issues found that need attention:'));
      if (missingInEn.length > 0) {
        console.log(`   • ${missingInEn.length} missing translations in English`);
      }
      if (extraInEn.length > 0) {
        console.log(`   • ${extraInEn.length} extra keys in English`);
      }
      if (emptyInZh.length > 0) {
        console.log(`   • ${emptyInZh.length} empty values in Chinese`);
      }
      if (emptyInEn.length > 0) {
        console.log(`   • ${emptyInEn.length} empty values in English`);
      }
    }
    
  } catch (error) {
    console.error(colors.red('❌ Error:'), error);
    process.exit(1);
  }
}

// 运行脚本
main();
