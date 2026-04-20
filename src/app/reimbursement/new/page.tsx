'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  Button, Card, message, Typography, Input, InputNumber, Select, Tag, Modal, DatePicker,
} from 'antd';
import { LeftOutlined, RightOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import MainLayout from '@/components/Layout/MainLayout';
import { TRANSPORT_TYPES } from '@/types';
import type { DailyDetail } from '@/types';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function NewReimbursementPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month'));
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [dailyDetails, setDailyDetails] = useState<Record<string, DailyDetail>>({});
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string | null>(null);

  const isDragging = useRef(false);
  const dragStart = useRef<string | null>(null);
  const dragMode = useRef<'select' | 'deselect'>('select');

  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const days: (dayjs.Dayjs | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(startOfMonth.date(i));
    return days;
  }, [currentMonth]);

  const toggleDate = useCallback((dateStr: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
        setDailyDetails(d => {
          const copy = { ...d };
          delete copy[dateStr];
          return copy;
        });
        if (editingDate === dateStr) setEditingDate(null);
      } else {
        next.add(dateStr);
        setDailyDetails(d => ({
          ...d,
          [dateStr]: d[dateStr] || {
            date: dateStr,
            destination: '',
            reason: '',
            transportTypes: [],
            transportFee: 0,
            hotelFee: 0,
            remark: '',
          },
        }));
        setEditingDate(dateStr);
      }
      return next;
    });
  }, [editingDate]);

  const handleMouseDown = useCallback((dateStr: string) => {
    isDragging.current = true;
    dragStart.current = dateStr;
    dragMode.current = selectedDates.has(dateStr) ? 'deselect' : 'select';
    toggleDate(dateStr);
  }, [selectedDates, toggleDate]);

  const handleMouseEnter = useCallback((dateStr: string) => {
    if (!isDragging.current) return;
    const isSelected = selectedDates.has(dateStr);
    if (dragMode.current === 'select' && !isSelected) {
      toggleDate(dateStr);
    } else if (dragMode.current === 'deselect' && isSelected) {
      toggleDate(dateStr);
    }
  }, [selectedDates, toggleDate]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    dragStart.current = null;
  }, []);

  const updateDetail = useCallback((dateStr: string, field: keyof DailyDetail, value: unknown) => {
    setDailyDetails(prev => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], [field]: value },
    }));
  }, []);

  const removeDate = useCallback((dateStr: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.delete(dateStr);
      return next;
    });
    setDailyDetails(prev => {
      const copy = { ...prev };
      delete copy[dateStr];
      return copy;
    });
    if (editingDate === dateStr) setEditingDate(null);
  }, [editingDate]);

  const sortedSelectedDates = useMemo(() =>
    Array.from(selectedDates).sort(),
    [selectedDates]
  );

  const totals = useMemo(() => {
    let totalHotel = 0;
    let totalTransport = 0;
    Object.values(dailyDetails).forEach(d => {
      totalHotel += Number(d.hotelFee) || 0;
      totalTransport += Number(d.transportFee) || 0;
    });
    return {
      totalHotelFee: Math.round(totalHotel * 100) / 100,
      totalTransportFee: Math.round(totalTransport * 100) / 100,
      totalAmount: Math.round((totalHotel + totalTransport) * 100) / 100,
    };
  }, [dailyDetails]);

  const isDetailComplete = (d: DailyDetail) =>
    d.destination && d.reason && d.transportTypes.length > 0;

  const handleSubmit = async () => {
    if (sortedSelectedDates.length === 0) {
      message.warning('请至少选择一天出差日期');
      return;
    }
    const incomplete = sortedSelectedDates.filter(d => !isDetailComplete(dailyDetails[d]));
    if (incomplete.length > 0) {
      message.warning(`以下日期信息未填完：${incomplete.join(', ')}`);
      setEditingDate(incomplete[0]);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        month: currentMonth.format('YYYY-MM'),
        dailyDetails: sortedSelectedDates.map(d => dailyDetails[d]),
      };
      const res = await fetch('/api/reimbursement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.reimbursement?.emailContent) {
          setEmailPreview(data.reimbursement.emailContent);
        } else {
          message.success('报销申请提交成功');
          router.push('/reimbursement/list');
        }
      } else {
        message.error(data.error || '提交失败');
      }
    } catch {
      message.error('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const currentDetail = editingDate ? dailyDetails[editingDate] : null;

  return (
    <MainLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>新建月度报销</Title>
        <DatePicker
          picker="month"
          value={currentMonth}
          onChange={v => { if (v) { setCurrentMonth(v.startOf('month')); setSelectedDates(new Set()); setDailyDetails({}); setEditingDate(null); } }}
          allowClear={false}
        />
      </div>

      <div style={{ display: 'flex', gap: 16, minHeight: 520 }} onMouseUp={handleMouseUp}>
        {/* 左侧日历 */}
        <Card
          style={{ flex: '0 0 420px' }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button type="text" icon={<LeftOutlined />} onClick={() => { setCurrentMonth(m => m.subtract(1, 'month')); setSelectedDates(new Set()); setDailyDetails({}); setEditingDate(null); }} />
              <Text strong style={{ fontSize: 16 }}>{currentMonth.format('YYYY年M月')}</Text>
              <Button type="text" icon={<RightOutlined />} onClick={() => { setCurrentMonth(m => m.add(1, 'month')); setSelectedDates(new Set()); setDailyDetails({}); setEditingDate(null); }} />
            </div>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, userSelect: 'none' }}>
            {WEEKDAY_LABELS.map(w => (
              <div key={w} style={{ textAlign: 'center', padding: '4px 0', fontWeight: 600, color: '#999', fontSize: 12 }}>{w}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = day.format('YYYY-MM-DD');
              const isSelected = selectedDates.has(dateStr);
              const detail = dailyDetails[dateStr];
              const isFilled = detail && isDetailComplete(detail);
              const isEditing = editingDate === dateStr;
              const isWeekend = day.day() === 0 || day.day() === 6;
              return (
                <div
                  key={dateStr}
                  onMouseDown={(e) => { e.preventDefault(); handleMouseDown(dateStr); }}
                  onMouseEnter={() => handleMouseEnter(dateStr)}
                  onClick={() => { if (isSelected) setEditingDate(dateStr); }}
                  style={{
                    position: 'relative',
                    textAlign: 'center',
                    padding: '10px 4px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    border: isEditing ? '2px solid #1677ff' : '2px solid transparent',
                    backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
                    color: isWeekend ? '#ff7875' : '#333',
                    fontWeight: isSelected ? 600 : 400,
                    fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  {day.date()}
                  {isFilled && (
                    <div style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 6, height: 6, borderRadius: '50%', backgroundColor: '#52c41a',
                    }} />
                  )}
                  {isSelected && !isFilled && (
                    <div style={{
                      position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                      width: 6, height: 6, borderRadius: '50%', backgroundColor: '#faad14',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: '#999', display: 'flex', gap: 16 }}>
            <span>🟢 已填写</span>
            <span>🟡 待填写</span>
            <span>已选 {selectedDates.size} 天</span>
          </div>
        </Card>

        {/* 右侧编辑面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 已选日期标签 */}
          <Card size="small" title={`已选日期（${sortedSelectedDates.length}天）`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {sortedSelectedDates.length === 0 && <Text type="secondary">在左侧日历中拖拽或点击选择出差日期</Text>}
              {sortedSelectedDates.map(d => {
                const detail = dailyDetails[d];
                const filled = detail && isDetailComplete(detail);
                return (
                  <Tag
                    key={d}
                    color={editingDate === d ? 'blue' : filled ? 'green' : 'orange'}
                    style={{ cursor: 'pointer', margin: 0 }}
                    onClick={() => setEditingDate(d)}
                    closable
                    onClose={(e) => { e.preventDefault(); removeDate(d); }}
                  >
                    {dayjs(d).format('M/D')}
                  </Tag>
                );
              })}
            </div>
          </Card>

          {/* 当日明细编辑 */}
          {currentDetail && editingDate && (
            <Card
              size="small"
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{dayjs(editingDate).format('YYYY年M月D日')} 明细</span>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeDate(editingDate)}>删除</Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>出差地</Text>
                  <Input
                    value={currentDetail.destination}
                    onChange={e => updateDetail(editingDate, 'destination', e.target.value)}
                    placeholder="例如：上海"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>出差原因</Text>
                  <Input
                    value={currentDetail.reason}
                    onChange={e => updateDetail(editingDate, 'reason', e.target.value)}
                    placeholder="简述出差目的"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>交通方式（多选）</Text>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    value={currentDetail.transportTypes}
                    onChange={v => updateDetail(editingDate, 'transportTypes', v)}
                    placeholder="选择交通方式"
                    options={TRANSPORT_TYPES.map(t => ({ label: t, value: t }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>差旅往返交通费（含高速）</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={currentDetail.transportFee}
                      onChange={v => updateDetail(editingDate, 'transportFee', v || 0)}
                      min={0} precision={2} addonAfter="元"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>出差地住宿费</Text>
                    <InputNumber
                      style={{ width: '100%' }}
                      value={currentDetail.hotelFee}
                      onChange={v => updateDetail(editingDate, 'hotelFee', v || 0)}
                      min={0} precision={2} addonAfter="元"
                    />
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>备注</Text>
                  <TextArea
                    rows={2}
                    value={currentDetail.remark}
                    onChange={e => updateDetail(editingDate, 'remark', e.target.value)}
                    placeholder="补充说明（选填）"
                  />
                </div>
              </div>
            </Card>
          )}

          {!editingDate && sortedSelectedDates.length > 0 && (
            <Card size="small" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">点击左侧日历中已选日期，或点击上方日期标签来编辑明细</Text>
            </Card>
          )}

          {sortedSelectedDates.length === 0 && (
            <Card size="small" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>在左侧日历中拖拽或点击选择出差日期</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>支持鼠标拖拽连续选择多天</Text>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 底部汇总栏 */}
      <Card style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>出差天数</Text>
              <Text strong style={{ fontSize: 20 }}>{sortedSelectedDates.length} 天</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>住宿费总额</Text>
              <Text strong style={{ fontSize: 20, color: '#1677ff' }}>¥{totals.totalHotelFee.toFixed(2)}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>交通费总额</Text>
              <Text strong style={{ fontSize: 20, color: '#1677ff' }}>¥{totals.totalTransportFee.toFixed(2)}</Text>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>报销总额</Text>
              <Text strong style={{ fontSize: 24, color: '#52c41a' }}>¥{totals.totalAmount.toFixed(2)}</Text>
            </div>
          </div>
          <Button type="primary" size="large" loading={loading} onClick={handleSubmit} disabled={sortedSelectedDates.length === 0}>
            提交 {currentMonth.format('M')} 月报销申请
          </Button>
        </div>
      </Card>

      <Modal
        title="邮件预览"
        open={!!emailPreview}
        onCancel={() => { setEmailPreview(null); message.success('报销申请提交成功'); router.push('/reimbursement/list'); }}
        width={650}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(emailPreview || '');
            message.success('邮件内容已复制到剪贴板');
          }}>复制邮件内容</Button>,
          <Button key="close" onClick={() => { setEmailPreview(null); router.push('/reimbursement/list'); }}>关闭</Button>,
        ]}
      >
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.8 }}>{emailPreview}</pre>
      </Modal>
    </MainLayout>
  );
}
