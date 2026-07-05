import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

/**
 * Server-synced countdown timer for the exam session.
 *
 * - Initialised from the server-provided remainingSeconds.
 * - Counts down client-side for performance.
 * - Re-syncs with the server every 30 seconds to correct drift.
 * - Calls onExpire() when timer reaches 0.
 *
 * @param {string} submissionId
 * @param {string} examId
 * @param {number} initialSeconds - from server on session load
 * @param {function} onExpire - called when time runs out
 */
const useExamTimer = (submissionId, examId, initialSeconds, onExpire) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds ?? 0);
  const intervalRef    = useRef(null);
  const syncIntervalRef = useRef(null);
  const expiredRef     = useRef(false);
  const onExpireRef    = useRef(onExpire);

  // Keep ref current without triggering re-runs
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Sync with server
  const syncWithServer = async () => {
    try {
      const { data } = await api.get(`/student/exams/${examId}/session`);
      setSecondsLeft(data.remainingSeconds);
    } catch (_) {
      // If session has ended the backend returns an error — timer will hit 0 naturally
    }
  };

  useEffect(() => {
    if (!initialSeconds || initialSeconds <= 0) return;
    setSecondsLeft(initialSeconds);
    expiredRef.current = false;

    // 1-second countdown tick
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          clearInterval(syncIntervalRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Re-sync every 30 seconds
    syncIntervalRef.current = setInterval(syncWithServer, 30_000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(syncIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeconds, submissionId]);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const formatted = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  const isWarning = secondsLeft <= 300 && secondsLeft > 60; // last 5 min
  const isDanger = secondsLeft <= 60; // last 60 seconds

  return { secondsLeft, formatted, isWarning, isDanger };
};

export default useExamTimer;
