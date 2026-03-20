"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID || "";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errMsg = "Request gagal";
    const e = data?.error;
    if (typeof e === "string") errMsg = e;
    else if (e && typeof e === "object") errMsg = e.message || e.details || JSON.stringify(e);
    throw new Error(errMsg);
  }
  return data;
}

export function useRelayControlApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const pollMs = options.pollMs ?? 1000;
  const [relay, setRelayState] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchRelay = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await fetchJson(`/api/relay?device_id=${deviceId}`);
      setRelayState(data.data || null);
    } catch (err) {
      console.error("Fetch relay gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    fetchRelay();
    if (pollMs > 0) {
      timerRef.current = setInterval(fetchRelay, pollMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId, pollMs, fetchRelay]);

  const setRelay = useCallback(
    async (patch) => {
      if (!deviceId) throw new Error("device_id kosong");
      const data = await fetchJson("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, ...patch }),
      });
      setRelayState(data.data || null);
      return data;
    },
    [deviceId]
  );

  const toggleRelay = useCallback(
    async (relayKey) => {
      if (!relayKey) throw new Error("relayKey kosong");
      const current = relay?.[relayKey] ?? false;
      return setRelay({ [relayKey]: !current });
    },
    [relay, setRelay]
  );

  return {
    relay,
    loading,
    refresh: fetchRelay,
    setRelay,
    toggleRelay,
  };
}

export function useLiveSensorApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const pollMs = options.pollMs ?? 2000;
  const liveEnabled = options.liveEnabled ?? true;
  const [sensor, setSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const isSameSensor = (a, b) => {
    if (!a || !b) return false;
    return (
      a.device_id === b.device_id &&
      a.soil_moisture1 === b.soil_moisture1 &&
      a.soil_moisture2 === b.soil_moisture2 &&
      a.air_temp === b.air_temp &&
      a.air_hum === b.air_hum &&
      a.temp1 === b.temp1 &&
      a.temp2 === b.temp2 &&
      a.lux === b.lux &&
      a.tds === b.tds
    );
  };

  const fetchSensor = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await fetchJson(`/api/live-sensor?device_id=${deviceId}`);
      setSensor((prev) => {
        const next = data.data || null;
        if (prev && next && isSameSensor(prev, next)) return prev;
        return next;
      });
    } catch (err) {
      console.error("Fetch live-sensor gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    fetchSensor();
    if (pollMs > 0 && liveEnabled) {
      timerRef.current = setInterval(fetchSensor, pollMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId, pollMs, liveEnabled, fetchSensor]);

  return { sensor, loading, refresh: fetchSensor };
}

export function useAutomationApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const pollMs = options.pollMs ?? 60000;
  const [automation, setAutomation] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAutomation = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await fetchJson(`/api/automation?device_id=${deviceId}`);
      setAutomation(data.data || null);
    } catch (err) {
      console.error("Fetch automation gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    fetchAutomation();
    if (pollMs > 0) {
      timerRef.current = setInterval(fetchAutomation, pollMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId, pollMs, fetchAutomation]);

  const updateAutomation = useCallback(
    async (patch) => {
      if (!deviceId) throw new Error("device_id kosong");
      const data = await fetchJson("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, ...patch }),
      });
      setAutomation(data.data || null);
      return data;
    },
    [deviceId]
  );

  const applyAutomation = useCallback(async () => {
    if (!deviceId) throw new Error("device_id kosong");
    const data = await fetchJson("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId, action: "apply" }),
    });
    setAutomation(data.data || null);
    return data;
  }, [deviceId]);

  return {
    automation,
    loading,
    refresh: fetchAutomation,
    updateAutomation,
    applyAutomation,
  };
}

export function useRelayLogsApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const limit = options.limit ?? 50;
  const hours = options.hours ?? null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;
    try {
      const url = hours 
        ? `/api/relay-logs?device_id=${deviceId}&hours=${hours}`
        : `/api/relay-logs?device_id=${deviceId}&limit=${limit}`;
      const data = await fetchJson(url);
      setLogs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch relay-logs gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limit, hours]);

  useEffect(() => {
    if (!deviceId) return;
    fetchLogs();
  }, [deviceId, fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}

export function useSensorLogsApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const limit = options.limit ?? 50;
  const hours = options.hours ?? null;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;
    try {
      const url = hours 
        ? `/api/sensor-logs?device_id=${deviceId}&hours=${hours}`
        : `/api/sensor-logs?device_id=${deviceId}&limit=${limit}`;
      const data = await fetchJson(url);
      setLogs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch sensor-logs gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limit, hours]);

  useEffect(() => {
    if (!deviceId) return;
    fetchLogs();
  }, [deviceId, fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}

export function useActivityLogApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const limit = options.limit ?? 50;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;
    try {
      const data = await fetchJson(`/api/activity-log?device_id=${deviceId}&limit=${limit}`);
      setLogs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Fetch activity-log gagal:", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId, limit]);

  useEffect(() => {
    if (!deviceId) return;
    fetchLogs();
  }, [deviceId, fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}
