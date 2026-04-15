import request from '../utils/request'

// ─── Types: Common ───────────────────────────────────────────────
export interface TimeRange {
    start: string
    end: string
}

// ─── Types: Energy Query ─────────────────────────────────────────
export interface EnergyPoint {
    timestamp: string
    building_id?: string | null
    meter?: string | null
    value: number
}

export interface EnergySummary {
    meter: string
    total: number
    average: number
    peak: number
    peak_time?: string | null
    unit: string
}

export interface Pagination {
    page: number
    page_size: number
    total: number
}

export interface EnergyQueryResponse {
    items: EnergyPoint[]
    summary: EnergySummary
    pagination?: Pagination
}

export interface EnergyQueryParams {
    building_ids?: string[]
    site_id?: string
    meter?: string
    start_time?: string
    end_time?: string
    granularity?: 'hour' | 'day' | 'week' | 'month'
    aggregation?: 'raw' | 'sum' | 'avg' | 'min' | 'max'
    page?: number
    page_size?: number
}

// ─── Types: COP Analysis ────────────────────────────────────────
export interface CopPoint {
    timestamp: string
    cop: number
}

export interface CopSummary {
    avg_cop: number
    min_cop: number
    max_cop: number
}

export interface CopAnalysisResponse {
    building_id: string
    time_range: TimeRange
    points: CopPoint[]
    summary?: CopSummary
}

export interface CopAnalysisParams {
    building_id?: string
    start_time?: string
    end_time?: string
    granularity?: 'hour' | 'day' | 'week' | 'month'
}

// ─── Types: Energy Trend ────────────────────────────────────────
export interface EnergyTrendParams {
    building_ids?: string[]
    site_id?: string
    meter?: string
    start_time?: string
    end_time?: string
    granularity?: 'hour' | 'day' | 'week' | 'month'
}

export interface EnergySeries {
    building_id?: string | null
    meter: string
    unit?: string | null
    points: EnergyPoint[]
}

export interface EnergyTrendResponse {
    time_range: TimeRange
    series: EnergySeries[]
}

// ─── API Functions ───────────────────────────────────────────────

/** 执行通用能耗查询（含 summary: total / peak / peak_time） */
export const getEnergyQuery = (params?: EnergyQueryParams) => {
    return request.get<EnergyQueryResponse>('/energy/query', {
        params: { ...params },
        timeout: 30000
    })
}

/** 获取 COP 计算结果（含 summary: avg_cop / min_cop / max_cop） */
export const getCopAnalysis = (params?: CopAnalysisParams) => {
    return request.get<CopAnalysisResponse>('/energy/cop', {
        params: { ...params },
        timeout: 30000
    })
}

/** 获取能耗趋势图数据 */
export const getEnergyTrendData = (params?: EnergyTrendParams) => {
    return request.get<EnergyTrendResponse>('/energy/trend', {
        params: { ...params },
        timeout: 30000
    })
}
