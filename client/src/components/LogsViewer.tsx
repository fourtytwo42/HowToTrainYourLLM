import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { FiFilter, FiSearch, FiX } from 'react-icons/fi';

interface LogsViewerProps {
  jobId: string;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export function LogsViewer({ jobId }: LogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('/logs-room');

    // Join job-specific room
    socketRef.current.emit('join', { jobId });

    // Listen for new logs
    socketRef.current.on('log', (log: LogEntry) => {
      setLogs((prevLogs) => [...prevLogs, log]);
    });

    // Fetch existing logs
    fetch(`/api/jobs/${jobId}/logs`)
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((error) => console.error('Failed to fetch logs:', error));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [jobId]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = search === '' || log.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'INFO':
        return 'text-blue-600';
      case 'WARN':
        return 'text-yellow-600';
      case 'ERROR':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center space-x-4 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as LogLevel | 'ALL')}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="ALL">All Levels</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warning</option>
          <option value="ERROR">Error</option>
        </select>

        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Auto-scroll</span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 font-mono text-sm">
        {filteredLogs.map((log, index) => (
          <div key={index} className="mb-1">
            <span className="text-gray-500">{log.timestamp}</span>
            <span className={`mx-2 ${getLogLevelColor(log.level)}`}>[{log.level}]</span>
            <span className="text-gray-900">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

export default LogsViewer; 