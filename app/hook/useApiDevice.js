"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DEVICE_ID = process.env.NEXT_PUBLIC_DEVICE_ID || "";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request gagal");
  return data;
}

export function useRelayControlApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const pollMs = options.pollMs ?? 1000;
  const [relay, setRelayState] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchRelay = useCallback(async () => {
    if (!deviceId) return;
    const data = await fetchJson(`/api/relay?device_id=${deviceId}`);
    setRelayState(data.data || null);
    setLoading(false);
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
  const [sensor, setSensor] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchSensor = useCallback(async () => {
    if (!deviceId) return;
    const data = await fetchJson(`/api/live-sensor?device_id=${deviceId}`);
    setSensor(data.data || null);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    fetchSensor();
    if (pollMs > 0) {
      timerRef.current = setInterval(fetchSensor, pollMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deviceId, pollMs, fetchSensor]);

  return { sensor, loading, refresh: fetchSensor };
}

export function useAutomationApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const pollMs = options.pollMs ?? 60000;
  const [automation, setAutomation] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchAutomation = useCallback(async () => {
    if (!deviceId) return;
    const data = await fetchJson(`/api/automation?device_id=${deviceId}`);
    setAutomation(data.data || null);
    setLoading(false);
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;
    const data = await fetchJson(`/api/relay-logs?device_id=${deviceId}&limit=${limit}`);
    setLogs(Array.isArray(data.data) ? data.data : []);
    setLoading(false);
  }, [deviceId, limit]);

  useEffect(() => {
    if (!deviceId) return;
    fetchLogs();
  }, [deviceId, fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}

export function useSensorLogsApi(deviceId = DEFAULT_DEVICE_ID, options = {}) {
  const limit = options.limit ?? 50;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!deviceId) return;
    const data = await fetchJson(`/api/sensor-logs?device_id=${deviceId}&limit=${limit}`);
    setLogs(Array.isArray(data.data) ? data.data : []);
    setLoading(false);
  }, [deviceId, limit]);

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
    const data = await fetchJson(`/api/activity-log?device_id=${deviceId}&limit=${limit}`);
    setLogs(Array.isArray(data.data) ? data.data : []);
    setLoading(false);
  }, [deviceId, limit]);

  useEffect(() => {
    if (!deviceId) return;
    fetchLogs();
  }, [deviceId, fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}
