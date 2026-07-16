/**
 * PTCAD Sales Hub API
 *
 * วิธีเริ่มต้นแบบอัตโนมัติ
 * 1) สร้าง Apps Script Project ใหม่
 * 2) วางไฟล์นี้ทั้งหมด
 * 3) Run ฟังก์ชัน setupPTCADSalesHub หนึ่งครั้ง และกดอนุญาตสิทธิ์
 * 4) Script จะสร้าง Google Sheet, ทุกแท็บ, หัวตาราง และข้อมูลตัวอย่างให้อัตโนมัติ
 * 5) เปิด Execution log เพื่อดู Spreadsheet URL หรือรัน getSetupInfo
 * 6) Deploy > New deployment > Web app
 */

const TZ = 'Asia/Bangkok';
const SPREADSHEET_NAME = 'PTCAD Sales Hub Database';
const SHEET_ID_PROPERTY = 'PTCAD_SHEET_ID';

const SHEET_DEFINITIONS = {
  Campaigns: [
    'campaign_id', 'campaign_name', 'product', 'description', 'landing_page',
    'kv_image', 'caption', 'utm_campaign', 'start_date', 'end_date',
    'is_active', 'display_order', 'created_at', 'updated_at'
  ],
  Salespeople: [
    'sales_id', 'display_name', 'ref_code', 'email', 'team',
    'is_active', 'display_order', 'created_at', 'updated_at'
  ],
  Channels: [
    'channel_id', 'display_name', 'utm_source', 'utm_medium',
    'is_active', 'display_order', 'created_at', 'updated_at'
  ],
  LinkHistory: [
    'history_id', 'timestamp', 'campaign_id', 'campaign_name', 'product',
    'landing_page', 'salesperson', 'channel', 'utm_source', 'utm_medium',
    'utm_campaign', 'utm_content', 'generated_url', 'caption', 'user_agent', 'ref_code'
  ],
  Settings: ['key', 'value', 'description']
};

function doGet() {
  try {
    const ss = getSpreadsheet_();
    return json_({
      success: true,
      message: 'PTCAD Sales Hub API is running',
      spreadsheetUrl: ss.getUrl()
    });
  } catch (error) {
    return json_({
      success: false,
      message: 'กรุณารัน setupPTCADSalesHub ก่อนใช้งาน: ' + error.message
    });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse((e.postData && e.postData.contents) || '{}');
    const handler = HANDLERS[request.action];
    if (!handler) throw new Error('Unknown action: ' + request.action);
    return json_(handler(request));
  } catch (error) {
    return json_({ success: false, message: error.message });
  }
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันหลักสำหรับติดตั้งระบบครั้งแรก
 * สร้าง Spreadsheet ใหม่ให้อัตโนมัติหากยังไม่มี Sheet ID ใน Script Properties
 */
function setupPTCADSalesHub() {
  const properties = PropertiesService.getScriptProperties();
  let spreadsheet = null;
  const savedId = properties.getProperty(SHEET_ID_PROPERTY);

  if (savedId) {
    try {
      spreadsheet = SpreadsheetApp.openById(savedId);
    } catch (error) {
      properties.deleteProperty(SHEET_ID_PROPERTY);
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    spreadsheet.setSpreadsheetTimeZone(TZ);
    properties.setProperty(SHEET_ID_PROPERTY, spreadsheet.getId());
  }

  createOrRepairSheets_(spreadsheet);
  seedDefaultData_(spreadsheet);

  if (!properties.getProperty('ADMIN_PASSWORD')) {
    properties.setProperty('ADMIN_PASSWORD', 'ptcad2026');
  }

  const result = {
    success: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    adminPassword: 'ptcad2026',
    message: 'สร้างฐานข้อมูล PTCAD Sales Hub เรียบร้อยแล้ว'
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/** แสดงข้อมูลการติดตั้งปัจจุบันใน Execution log */
function getSetupInfo() {
  const spreadsheet = getSpreadsheet_();
  const result = {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    sheets: spreadsheet.getSheets().map(sheet => sheet.getName())
  };
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/** ใช้เมื่อต้องการสร้าง/ซ่อมหัวตารางอีกครั้ง โดยไม่ลบข้อมูลเดิม */
function repairSheets() {
  const spreadsheet = getSpreadsheet_();
  createOrRepairSheets_(spreadsheet);
  return getSetupInfo();
}

/** เพิ่มข้อมูลตัวอย่างเฉพาะแท็บที่ยังไม่มีข้อมูล */
function seedDefaultData() {
  const spreadsheet = getSpreadsheet_();
  seedDefaultData_(spreadsheet);
  return getSetupInfo();
}

/** เปลี่ยนรหัสผ่าน CMS */
function setAdminPassword(newPassword) {
  if (!newPassword || String(newPassword).length < 6) {
    throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', String(newPassword));
  return { success: true, message: 'เปลี่ยนรหัสผ่าน CMS เรียบร้อยแล้ว' };
}


/**
 * บันทึก TinyURL API Token อย่างปลอดภัยใน Script Properties
 * สร้าง Token จาก TinyURL > Profile > API และเปิดสิทธิ์ Create TinyURL
 */
function setTinyUrlApiToken(token) {
  if (!token || String(token).trim().length < 10) {
    throw new Error('กรุณาใส่ TinyURL API Token ที่ถูกต้อง');
  }
  PropertiesService.getScriptProperties()
    .setProperty('TINYURL_API_TOKEN', String(token).trim());
  return { success: true, message: 'บันทึก TinyURL API Token เรียบร้อยแล้ว' };
}

function removeTinyUrlApiToken() {
  PropertiesService.getScriptProperties().deleteProperty('TINYURL_API_TOKEN');
  return { success: true, message: 'ลบ TinyURL API Token แล้ว' };
}

function shortenWithTinyUrl_(longUrl) {
  if (!longUrl) throw new Error('ไม่พบ URL ที่ต้องการย่อ');

  let parsed;
  try {
    parsed = new URL(longUrl);
  } catch (error) {
    throw new Error('URL ไม่ถูกต้อง');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('รองรับเฉพาะ URL ที่ขึ้นต้นด้วย http หรือ https');
  }

  const token = PropertiesService.getScriptProperties()
    .getProperty('TINYURL_API_TOKEN');

  if (!token) {
    throw new Error('ยังไม่ได้ตั้งค่า TinyURL API Token ใน Apps Script');
  }

  const response = UrlFetchApp.fetch('https://api.tinyurl.com/create', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json'
    },
    payload: JSON.stringify({
      url: longUrl,
      domain: 'tinyurl.com'
    }),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();

  let result;
  try {
    result = JSON.parse(body);
  } catch (error) {
    throw new Error('TinyURL ตอบกลับไม่ถูกต้อง');
  }

  if (status < 200 || status >= 300 || !result.data || !result.data.tiny_url) {
    const message =
      (result.errors && result.errors[0] && result.errors[0].message) ||
      result.message ||
      'TinyURL API ไม่สามารถย่อลิงก์ได้';
    throw new Error(message);
  }

  return {
    success: true,
    short_url: result.data.tiny_url,
    long_url: longUrl
  };
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(SHEET_ID_PROPERTY);
  if (!id) throw new Error('ไม่พบ PTCAD_SHEET_ID ใน Script Properties');
  return SpreadsheetApp.openById(id);
}

function getSheet_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('ไม่พบ Sheet: ' + name);
  return sheet;
}

function createOrRepairSheets_(spreadsheet) {
  const defaultSheet = spreadsheet.getSheetByName('Sheet1');

  Object.entries(SHEET_DEFINITIONS).forEach(([name, headers]) => {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);

    const currentHeaders = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
      : [];

    headers.forEach((header, index) => {
      if (currentHeaders[index] !== header) {
        sheet.getRange(1, index + 1).setValue(header);
      }
    });

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0B5ED7')
      .setFontColor('#FFFFFF')
      .setHorizontalAlignment('center');
    sheet.autoResizeColumns(1, headers.length);
    sheet.setColumnWidths(1, headers.length, 145);

    if (name === 'Campaigns') {
      sheet.setColumnWidth(headers.indexOf('description') + 1, 280);
      sheet.setColumnWidth(headers.indexOf('caption') + 1, 360);
      sheet.setColumnWidth(headers.indexOf('landing_page') + 1, 300);
      sheet.setColumnWidth(headers.indexOf('kv_image') + 1, 300);
    }

    if (name === 'LinkHistory') {
      sheet.setColumnWidth(headers.indexOf('generated_url') + 1, 420);
      sheet.setColumnWidth(headers.indexOf('caption') + 1, 360);
    }
  });

  if (defaultSheet && spreadsheet.getSheets().length > 1 && defaultSheet.getLastRow() === 0) {
    spreadsheet.deleteSheet(defaultSheet);
  }
}

function seedDefaultData_(spreadsheet) {
  const now = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");

  appendRowsIfEmpty_(spreadsheet, 'Campaigns', [
    {
      campaign_id: 'CMP001',
      campaign_name: 'PTCAD Lite 2026',
      product: 'PTCAD Lite',
      description: 'โปรแกรม CAD สำหรับงานเขียนแบบ 2D เริ่มเพียง 3,650 บาท',
      landing_page: 'https://ptcadthailand.com/pricing/',
      kv_image: '',
      caption: 'PTCAD Lite 2026 สำหรับงานเขียนแบบ 2D รองรับไฟล์ DWG และทดลองใช้ฟรี 30 วัน\n\nดูรายละเอียด: {{generated_url}}',
      utm_campaign: 'ptcad_lite_2026',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      is_active: true,
      display_order: 1,
      created_at: now,
      updated_at: now
    },
    {
      campaign_id: 'CMP002',
      campaign_name: 'ทดลองใช้ฟรี 30 วัน',
      product: 'PTCAD',
      description: 'สร้างลิงก์สำหรับส่งลูกค้าที่ต้องการทดลองใช้ก่อนตัดสินใจ',
      landing_page: 'https://ptcadthailand.com/sales-ptcad-th/',
      kv_image: '',
      caption: 'ทดลองใช้ PTCAD ฟรี 30 วัน ไม่มีเงื่อนไข\n{{generated_url}}',
      utm_campaign: 'ptcad_trial_30days',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      is_active: true,
      display_order: 2,
      created_at: now,
      updated_at: now
    },
    {
      campaign_id: 'CMP003',
      campaign_name: 'PTCAD สำหรับองค์กร',
      product: 'PTCAD Business',
      description: 'ขอใบเสนอราคาสำหรับองค์กรหรือซื้อหลาย License',
      landing_page: 'https://ptcadthailand.com/contact/',
      kv_image: '',
      caption: 'สนใจ PTCAD สำหรับองค์กรหรือหลาย License ติดต่อทีมงานเพื่อรับใบเสนอราคาได้ที่ {{generated_url}}',
      utm_campaign: 'ptcad_business_2026',
      start_date: '2026-07-01',
      end_date: '2026-12-31',
      is_active: true,
      display_order: 3,
      created_at: now,
      updated_at: now
    }
  ]);

  appendRowsIfEmpty_(spreadsheet, 'Salespeople', [
    { sales_id: 'S001', display_name: 'Ball', ref_code: 'ball', email: '', team: 'Sales', is_active: true, display_order: 1, created_at: now, updated_at: now },
    { sales_id: 'S002', display_name: 'Aum', ref_code: 'aum', email: '', team: 'Sales', is_active: true, display_order: 2, created_at: now, updated_at: now },
    { sales_id: 'S003', display_name: 'Amnat', ref_code: 'amnat', email: '', team: 'Sales', is_active: true, display_order: 3, created_at: now, updated_at: now },
    { sales_id: 'S004', display_name: 'Gyokoi', ref_code: 'gyokoi', email: '', team: 'Marketing', is_active: true, display_order: 4, created_at: now, updated_at: now }
  ]);

  appendRowsIfEmpty_(spreadsheet, 'Channels', [
    { channel_id: 'CH01', display_name: 'LINE ส่วนตัว', utm_source: 'line', utm_medium: 'sales', is_active: true, display_order: 1, created_at: now, updated_at: now },
    { channel_id: 'CH02', display_name: 'LINE OA', utm_source: 'line-oa', utm_medium: 'broadcast', is_active: true, display_order: 2, created_at: now, updated_at: now },
    { channel_id: 'CH03', display_name: 'Facebook', utm_source: 'facebook', utm_medium: 'social', is_active: true, display_order: 3, created_at: now, updated_at: now },
    { channel_id: 'CH04', display_name: 'Messenger', utm_source: 'messenger', utm_medium: 'sales', is_active: true, display_order: 4, created_at: now, updated_at: now },
    { channel_id: 'CH05', display_name: 'Email', utm_source: 'email', utm_medium: 'sales-email', is_active: true, display_order: 5, created_at: now, updated_at: now },
    { channel_id: 'CH06', display_name: 'LinkedIn', utm_source: 'linkedin', utm_medium: 'social', is_active: true, display_order: 6, created_at: now, updated_at: now },
    { channel_id: 'CH07', display_name: 'Webinar', utm_source: 'webinar', utm_medium: 'event', is_active: true, display_order: 7, created_at: now, updated_at: now },
    { channel_id: 'CH08', display_name: 'Event / QR Code', utm_source: 'qr', utm_medium: 'offline', is_active: true, display_order: 8, created_at: now, updated_at: now }
  ]);

  appendRowsIfEmpty_(spreadsheet, 'Settings', [
    { key: 'site_name', value: 'PTCAD Sales Hub', description: 'ชื่อระบบ' },
    { key: 'logo_url', value: 'https://ptcad.alicetletech.com/assets/images/ptcad-logo.png', description: 'URL โลโก้ PTCAD' },
    { key: 'timezone', value: TZ, description: 'เขตเวลา' },
    { key: 'history_limit', value: '20', description: 'จำนวนประวัติที่แสดงในหน้าหลัก' }
  ]);
}

function appendRowsIfEmpty_(spreadsheet, sheetName, objects) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() > 1) return;

  const headers = SHEET_DEFINITIONS[sheetName];
  const rows = objects.map(object => headers.map(header => object[header] ?? ''));
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function rows_(name) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values
    .filter(row => row.some(value => value !== ''))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, normalizeCell_(row[index])])));
}

function normalizeCell_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, TZ, 'yyyy-MM-dd');
  }
  return value;
}

function append_(name, object) {
  const sheet = getSheet_(name);
  const headers = SHEET_DEFINITIONS[name];
  sheet.appendRow(headers.map(header => object[header] ?? ''));
}

function upsert_(name, key, object) {
  const sheet = getSheet_(name);
  const headers = SHEET_DEFINITIONS[name];
  const values = sheet.getDataRange().getValues();
  const keyIndex = headers.indexOf(key);
  const rowIndex = values.findIndex((row, index) => index > 0 && String(row[keyIndex]) === String(object[key]));
  const row = headers.map(header => object[header] ?? '');

  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function remove_(name, key, id) {
  const sheet = getSheet_(name);
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const keyIndex = headers.indexOf(key);
  for (let index = values.length - 1; index > 0; index--) {
    if (String(values[index][keyIndex]) === String(id)) sheet.deleteRow(index + 1);
  }
}

function isTrue_(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function withAuditFields_(item, idField) {
  const now = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss");
  const output = { ...item };
  if (!output[idField]) output[idField] = Utilities.getUuid();
  if (!output.created_at) output.created_at = now;
  output.updated_at = now;
  return output;
}


function createAdminSession_() {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('ADMIN_SESSION_' + token, 'valid', 21600);
  return token;
}

function isAdminSessionValid_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('ADMIN_SESSION_' + token) === 'valid';
}

function requireAdmin_(request) {
  if (!isAdminSessionValid_(request.token)) {
    throw new Error('Session CMS หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }
}

function isCampaignCurrentlyVisible_(item) {
  if (!isTrue_(item.is_active)) return false;
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  if (item.start_date && String(item.start_date) > today) return false;
  if (item.end_date && String(item.end_date) < today) return false;
  return true;
}

const HANDLERS = {
  getActiveCampaigns: () => ({
    success: true,
    data: rows_('Campaigns').filter(isCampaignCurrentlyVisible_)
  }),
  getAllCampaigns: request => {
    requireAdmin_(request);
    return { success: true, data: rows_('Campaigns') };
  },
  getSalespeople: () => ({
    success: true,
    data: rows_('Salespeople').filter(item => isTrue_(item.is_active))
  }),
  getAllSalespeople: request => {
    requireAdmin_(request);
    return { success: true, data: rows_('Salespeople') };
  },
  getChannels: () => ({
    success: true,
    data: rows_('Channels').filter(item => isTrue_(item.is_active))
  }),
  getAllChannels: request => {
    requireAdmin_(request);
    return { success: true, data: rows_('Channels') };
  },
  getLinkHistory: () => ({
    success: true,
    data: rows_('LinkHistory').reverse()
  }),
  shortenUrl: request => shortenWithTinyUrl_(request.url),
  saveLinkHistory: request => {
    append_('LinkHistory', {
      ...request.record,
      history_id: Utilities.getUuid(),
      timestamp: Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"),
      user_agent: request.record.user_agent || ''
    });
    return { success: true };
  },
  saveCampaign: request => {
    requireAdmin_(request);
    upsert_('Campaigns', 'campaign_id', withAuditFields_(request.item, 'campaign_id'));
    return { success: true };
  },
  deleteCampaign: request => {
    requireAdmin_(request);
    remove_('Campaigns', 'campaign_id', request.id);
    return { success: true };
  },
  saveSalesperson: request => {
    requireAdmin_(request);
    upsert_('Salespeople', 'sales_id', withAuditFields_(request.item, 'sales_id'));
    return { success: true };
  },
  saveChannel: request => {
    requireAdmin_(request);
    upsert_('Channels', 'channel_id', withAuditFields_(request.item, 'channel_id'));
    return { success: true };
  },
  adminLogin: request => {
    const password = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || 'ptcad2026';
    return request.password === password
      ? { success: true, token: createAdminSession_() }
      : { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
  },
  validateSession: request => ({
    success: isAdminSessionValid_(request.token)
  })
};
