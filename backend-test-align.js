/**
 * 对齐功能测试套件
 * 用于验证 POST /chat/sessions/:id/align 和 GET /chat/sessions/:id 的功能
 */

const axios = require('axios');

// 配置
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.example.com' 
  : 'http://localhost:3000';

const API_BASE = `${BASE_URL}/api`;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 测试 1: 创建会话
 */
async function testCreateSession() {
  log('blue', '\n📝 测试 1: 创建会话');
  
  try {
    const response = await axios.post(`${API_BASE}/chat/sessions`, {
      title: '测试会话 - 对齐功能'
    });
    
    const sessionId = response.data.data._id;
    log('green', `✅ 会话创建成功: ${sessionId}`);
    return sessionId;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试 2: 获取会话信息
 */
async function testGetSession(sessionId) {
  log('blue', '\n📝 测试 2: 获取会话信息');
  
  try {
    const response = await axios.get(`${API_BASE}/chat/sessions/${sessionId}`);
    
    const session = response.data.data;
    log('green', `✅ 会话获取成功`);
    console.log('  - Title:', session.title);
    console.log('  - Created:', session.createdAt);
    console.log('  - Has alignment:', !!session.alignmentResult);
    
    return session;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试 3: 更新会话的任务规范和模型契约
 */
async function testUpdateSessionData(sessionId) {
  log('blue', '\n📝 测试 3: 更新会话数据');
  
  try {
    // 模拟任务规范
    const taskSpec = {
      task: '黄河流域水文变化预测',
      requirements: [
        '分析空间分布',
        '预测未来趋势'
      ]
    };
    
    // 模拟模型契约
    const modelContract = {
      Required_slots: [
        {
          Input_name: 'raster_input',
          Input_type: 'raster',
          description: '栅格数据（DEM、降雨）'
        },
        {
          Input_name: 'vector_input',
          Input_type: 'vector',
          description: '矢量数据（流域边界、河流）'
        }
      ]
    };
    
    const response = await axios.patch(
      `${API_BASE}/chat/sessions/${sessionId}`,
      {
        taskSpec,
        modelContract
      }
    );
    
    log('green', `✅ 会话数据更新成功`);
    return response.data.data;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试 4: 模拟扫描结果（如果需要）
 */
async function testAddScanResults(sessionId) {
  log('blue', '\n📝 测试 4: 添加扫描结果');
  
  try {
    const scanResults = {
      'dem_data': {
        profile: {
          type: 'raster',
          crs: 'EPSG:4326',
          bounds: [110.0, 30.0, 120.0, 40.0],
          featureCount: 1
        }
      },
      'river_boundary': {
        profile: {
          type: 'vector',
          crs: 'EPSG:4326',
          bounds: [110.5, 31.0, 119.5, 39.0],
          featureCount: 50
        }
      }
    };
    
    const response = await axios.patch(
      `${API_BASE}/chat/sessions/${sessionId}`,
      { scanResults }
    );
    
    log('green', `✅ 扫描结果添加成功`);
    return response.data.data;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试 5: 调用对齐接口
 */
async function testAlignSession(sessionId) {
  log('blue', '\n📝 测试 5: 调用对齐接口');
  
  try {
    const startTime = Date.now();
    
    const response = await axios.post(
      `${API_BASE}/chat/sessions/${sessionId}/align`,
      {},
      { timeout: 30000 } // 30 秒超时
    );
    
    const duration = Date.now() - startTime;
    
    log('green', `✅ 对齐成功 (${duration}ms)`);
    console.log('  Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    if (error.response) {
      console.log('  Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * 测试 6: 验证对齐结果被持久化
 */
async function testVerifyAlignmentPersistence(sessionId) {
  log('blue', '\n📝 测试 6: 验证持久化');
  
  try {
    const response = await axios.get(`${API_BASE}/chat/sessions/${sessionId}`);
    
    const session = response.data.data;
    
    if (!session.alignmentResult) {
      throw new Error('对齐结果未被持久化到数据库');
    }
    
    log('green', `✅ 对齐结果已成功持久化`);
    console.log('  Status:', session.alignmentResult.status);
    console.log('  Matches:', session.alignmentResult.matches?.length || 0);
    console.log('  Summary:', session.alignmentResult.summary);
    
    return session.alignmentResult;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    throw error;
  }
}

/**
 * 测试 7: 检查对齐结果质量
 */
function testAlignmentQuality(alignmentResult) {
  log('blue', '\n📝 测试 7: 对齐质量检查');
  
  try {
    const { matches, summary } = alignmentResult;
    
    // 检查是否有匹配
    if (!matches || matches.length === 0) {
      log('yellow', '⚠️  警告: 没有找到匹配');
      return;
    }
    
    // 检查信心度
    const avgConfidence = summary?.confidence_avg || 0;
    if (avgConfidence < 0.5) {
      log('yellow', `⚠️  警告: 平均信心度过低 (${(avgConfidence * 100).toFixed(1)}%)`);
    } else {
      log('green', `✅ 信心度良好 (${(avgConfidence * 100).toFixed(1)}%)`);
    }
    
    // 列出匹配
    console.log('  匹配详情:');
    matches.forEach((match, idx) => {
      console.log(`    ${idx + 1}. ${match.input_slot} <- ${match.data_file}`);
      console.log(`       信心度: ${(match.confidence * 100).toFixed(1)}%, 原因: ${match.reason}`);
    });
    
    return true;
  } catch (error) {
    log('red', `❌ 失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试 8: 错误处理 - 不存在的会话
 */
async function testErrorHandling() {
  log('blue', '\n📝 测试 8: 错误处理 - 不存在的会话');
  
  try {
    const invalidId = '507f1f77bcf86cd799439fff';
    
    await axios.post(`${API_BASE}/chat/sessions/${invalidId}/align`);
    
    log('red', '❌ 应该返回 404 错误');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      log('green', `✅ 正确返回 404 错误`);
      return true;
    } else {
      log('red', `❌ 错误: 返回了 ${error.response?.status} 而不是 404`);
      return false;
    }
  }
}

/**
 * 主测试套件
 */
async function runAllTests() {
  log('bright', '\n🚀 开始对齐功能集成测试\n');
  
  let sessionId;
  const results = [];
  
  try {
    // 依次运行测试
    sessionId = await testCreateSession();
    results.push({ name: '创建会话', passed: true });
    
    await testGetSession(sessionId);
    results.push({ name: '获取会话', passed: true });
    
    await testUpdateSessionData(sessionId);
    results.push({ name: '更新会话数据', passed: true });
    
    await testAddScanResults(sessionId);
    results.push({ name: '添加扫描结果', passed: true });
    
    const alignResponse = await testAlignSession(sessionId);
    results.push({ name: '调用对齐接口', passed: true });
    
    const alignmentResult = await testVerifyAlignmentPersistence(sessionId);
    results.push({ name: '验证持久化', passed: true });
    
    testAlignmentQuality(alignmentResult);
    results.push({ name: '质量检查', passed: true });
    
    const errorHandlingPassed = await testErrorHandling();
    results.push({ name: '错误处理', passed: errorHandlingPassed });
    
  } catch (error) {
    log('red', `\n❌ 测试中止: ${error.message}`);
  }
  
  // 总结
  log('blue', '\n' + '='.repeat(50));
  log('bright', '测试总结');
  log('blue', '='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  log('blue', '='.repeat(50));
  log('bright', `结果: ${passed}/${total} 通过`);
  log('blue', '='.repeat(50) + '\n');
  
  if (passed === total) {
    log('green', '🎉 所有测试通过！对齐功能准备就绪。\n');
  } else {
    log('red', '⚠️  有些测试失败，请检查后端实现。\n');
  }
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    log('red', `\n致命错误: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testCreateSession,
  testGetSession,
  testAlignSession,
  testVerifyAlignmentPersistence,
  runAllTests
};
