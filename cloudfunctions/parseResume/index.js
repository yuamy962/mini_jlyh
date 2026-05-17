const cloud = require('wx-server-sdk');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { fileID } = event;

  if (!fileID) {
    return {
      success: false,
      message: 'fileID 不能为空'
    };
  }

  try {
    // 1. 从云存储下载文件到临时目录
    const res = await cloud.downloadFile({ fileID });
    const buffer = res.fileContent;

    if (!buffer || buffer.length === 0) {
      return {
        success: false,
        message: '文件下载失败或文件为空'
      };
    }

    // 2. 使用 pdf-parse 解析 PDF
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text || '';

    // 3. 清洗文本：去除多余空行、空格等
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (!cleanedText) {
      return {
        success: false,
        message: '未能从PDF中提取到文字内容，请尝试手动粘贴'
      };
    }

    return {
      success: true,
      data: {
        text: cleanedText,
        pageCount: pdfData.numpages || 1
      }
    };

  } catch (error) {
    console.error('PDF解析失败:', error);
    return {
      success: false,
      message: 'PDF解析失败：' + (error.message || '未知错误')
    };
  }
};
