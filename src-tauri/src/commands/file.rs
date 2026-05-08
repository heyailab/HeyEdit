use serde::Serialize;
use std::fs::{read, write};

/// 读取文件并自动检测编码，返回 UTF-8 字符串
#[tauri::command]
pub async fn read_file_with_encoding(path: String) -> Result<ReadFileResult, String> {
    // 先检查文件大小，大文件给出性能提示
    let size_warning = match std::fs::metadata(&path) {
        Ok(meta) => {
            let size = meta.len();
            if size > 1_000_000 {
                let mb = size as f64 / 1_000_000.0;
                Some(format!("文件大小 {:.1} MB，大文件可能影响编辑性能", mb))
            } else {
                None
            }
        }
        Err(_) => None,
    };

    let bytes = read(&path).map_err(|e| format!("无法读取文件: {}", e))?;

    // 检测编码
    let (encoding_label, content) = detect_and_decode(&bytes);

    Ok(ReadFileResult {
        content,
        encoding: encoding_label.to_string(),
        size_warning,
    })
}

/// 以 UTF-8 编码写入文件
#[tauri::command]
pub async fn write_file_utf8(path: String, content: String) -> Result<(), String> {
    write(&path, content.as_bytes()).map_err(|e| format!("无法保存文件: {}", e))
}

#[derive(Serialize)]
pub struct ReadFileResult {
    pub content: String,
    pub encoding: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_warning: Option<String>,
}

/// 检测字节流的编码并解码为 UTF-8 字符串
fn detect_and_decode(bytes: &[u8]) -> (&'static str, String) {
    // 1. 先检查 BOM
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        let s = String::from_utf8_lossy(&bytes[3..]);
        return ("UTF-8 BOM", s.to_string());
    }
    if bytes.starts_with(&[0xFF, 0xFE]) {
        let utf16 = bytes_to_utf16_le(&bytes[2..]);
        if let Ok(s) = String::from_utf16(&utf16) {
            return ("UTF-16 LE", s);
        }
    }
    if bytes.starts_with(&[0xFE, 0xFF]) {
        let utf16 = bytes_to_utf16_be(&bytes[2..]);
        if let Ok(s) = String::from_utf16(&utf16) {
            return ("UTF-16 BE", s);
        }
    }

    // 2. 用 chardetng 检测编码
    let mut detector = chardetng::EncodingDetector::new();
    detector.feed(&bytes, true);
    let encoding = detector.guess(None, true);

    // 3. 用 encoding_rs 解码（返回 3 个值：Cow、&Encoding、bool）
    let (cow, _encoding_used, _had_replacements) = encoding.decode(&bytes);
    let label = match encoding.name() {
        "UTF-8" => "UTF-8",
        "GBK" => "GBK",
        "GB18030" => "GB18030",
        "SHIFT_JIS" => "Shift_JIS",
        other => other,
    };

    (label, cow.to_string())
}

fn bytes_to_utf16_le(bytes: &[u8]) -> Vec<u16> {
    bytes
        .chunks_exact(2)
        .map(|c| u16::from_le_bytes([c[0], c[1]]))
        .collect()
}

fn bytes_to_utf16_be(bytes: &[u8]) -> Vec<u16> {
    bytes
        .chunks_exact(2)
        .map(|c| u16::from_be_bytes([c[0], c[1]]))
        .collect()
}
