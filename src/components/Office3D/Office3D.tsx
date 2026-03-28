'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import { AGENTS } from './agentsConfig';
import type { AgentConfig, AgentState, AgentStatus } from './agentsConfig';
import AgentDesk from './AgentDesk';
import Floor from './Floor';
import Walls from './Walls';
import Lights from './Lights';
import AgentPanel from './AgentPanel';
import FileCabinet from './FileCabinet';
import Whiteboard from './Whiteboard';
import CoffeeMachine from './CoffeeMachine';
import PlantPot from './PlantPot';
import WallClock from './WallClock';
import FirstPersonControls from './FirstPersonControls';
import MovingAvatar from './MovingAvatar';

interface OfficeApiAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  currentTask: string;
  isActive: boolean;
  model?: string;
  lastActivity?: string;
  activeSessions?: number;
  source?: string;
}

interface OfficeApiResponse {
  agents?: OfficeApiAgent[];
  source?: string;
  error?: string;
}

interface SceneAgent {
  config: AgentConfig;
  state: AgentState;
}

function inferStatus(agent: OfficeApiAgent): AgentStatus {
  const task = agent.currentTask.toUpperCase();

  if (task.startsWith('ACTIVE')) return 'working';
  if (task.startsWith('IDLE')) return 'idle';
  if (task.startsWith('SLEEPING')) return 'idle';
  if (task.includes('ERROR') || task.includes('FAILED')) return 'error';
  return agent.isActive ? 'working' : 'idle';
}

function buildSceneAgents(dataAgents: OfficeApiAgent[]): SceneAgent[] {
  return AGENTS.map((slot, index) => {
    const liveAgent = dataAgents[index];

    if (!liveAgent) {
      return {
        config: slot,
        state: {
          id: slot.id,
          status: 'idle',
          currentTask: 'Waiting for agent assignment',
          model: undefined,
          tokensPerHour: 0,
          tasksInQueue: 0,
          uptime: 0,
        },
      };
    }

    const status = inferStatus(liveAgent);

    return {
      config: {
        ...slot,
        id: liveAgent.id,
        name: liveAgent.name,
        emoji: liveAgent.emoji,
        color: liveAgent.color || slot.color,
        role: liveAgent.role || slot.role,
      },
      state: {
        id: liveAgent.id,
        status,
        currentTask: liveAgent.currentTask,
        model: liveAgent.model,
        tokensPerHour: liveAgent.isActive ? 1200 * Math.max(liveAgent.activeSessions || 1, 1) : 0,
        tasksInQueue: liveAgent.activeSessions || 0,
        uptime: liveAgent.lastActivity
          ? Math.max(1, Math.floor((Date.now() - new Date(liveAgent.lastActivity).getTime()) / 86400000))
          : 0,
      },
    };
  });
}

export default function Office3D() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [interactionModal, setInteractionModal] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<'orbit' | 'fps'>('orbit');
  const [avatarPositions, setAvatarPositions] = useState<Map<string, Vector3>>(new Map());
  const [apiAgents, setApiAgents] = useState<OfficeApiAgent[]>([]);
  const [officeSource, setOfficeSource] = useState<string>('loading');
  const [officeError, setOfficeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOfficeData = async () => {
      try {
        const response = await fetch('/api/office', { cache: 'no-store' });
        const data = (await response.json()) as OfficeApiResponse;

        if (cancelled) return;

        if (!response.ok) {
          setOfficeError(data.error || 'Failed to load office data');
          setApiAgents([]);
          setOfficeSource('error');
          return;
        }

        setApiAgents(Array.isArray(data.agents) ? data.agents : []);
        setOfficeSource(data.source || 'unknown');
        setOfficeError(data.error || null);
      } catch (error) {
        if (cancelled) return;
        setApiAgents([]);
        setOfficeSource('error');
        setOfficeError(error instanceof Error ? error.message : 'Failed to load office data');
      }
    };

    loadOfficeData();
    const interval = window.setInterval(loadOfficeData, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const sceneAgents = useMemo(() => buildSceneAgents(apiAgents), [apiAgents]);

  const handleDeskClick = (agentId: string) => {
    setSelectedAgent(agentId);
  };

  const handleClosePanel = () => {
    setSelectedAgent(null);
  };

  const handleFileCabinetClick = () => {
    setInteractionModal('memory');
  };

  const handleWhiteboardClick = () => {
    setInteractionModal('roadmap');
  };

  const handleCoffeeClick = () => {
    setInteractionModal('energy');
  };

  const handleCloseModal = () => {
    setInteractionModal(null);
  };

  const handleAvatarPositionUpdate = (id: string, position: Vector3) => {
    setAvatarPositions((prev) => new Map(prev).set(id, position));
  };

  const obstacles = [
    ...sceneAgents.map(({ config }) => ({
      position: new Vector3(config.position[0], 0, config.position[2]),
      radius: 1.5,
    })),
    { position: new Vector3(-8, 0, -5), radius: 0.8 },
    { position: new Vector3(0, 0, -8), radius: 1.5 },
    { position: new Vector3(8, 0, -5), radius: 0.6 },
    { position: new Vector3(-7, 0, 6), radius: 0.5 },
    { position: new Vector3(7, 0, 6), radius: 0.5 },
    { position: new Vector3(-9, 0, 0), radius: 0.4 },
    { position: new Vector3(9, 0, 0), radius: 0.4 },
  ];

  const selectedSceneAgent = sceneAgents.find(({ config }) => config.id === selectedAgent) || null;
  const selectedApiAgent = apiAgents.find((agent) => agent.id === selectedAgent) || null;

  return (
    <div className="fixed inset-0 bg-gray-900" style={{ height: '100vh', width: '100vw' }}>
      <Canvas
        camera={{ position: [0, 8, 12], fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: false }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={
          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        }>
          <Lights />
          <Sky sunPosition={[100, 20, 100]} />
          <Environment preset="sunset" />
          <Floor />
          <Walls />

          {sceneAgents.map(({ config, state }) => (
            <AgentDesk
              key={config.id}
              agent={config}
              state={state}
              onClick={() => handleDeskClick(config.id)}
              isSelected={selectedAgent === config.id}
            />
          ))}

          {sceneAgents.map(({ config, state }) => (
            <MovingAvatar
              key={`avatar-${config.id}`}
              agent={config}
              state={state}
              officeBounds={{ minX: -8, maxX: 8, minZ: -7, maxZ: 7 }}
              obstacles={obstacles}
              otherAvatarPositions={avatarPositions}
              onPositionUpdate={handleAvatarPositionUpdate}
            />
          ))}

          <FileCabinet position={[-8, 0, -5]} onClick={handleFileCabinetClick} />
          <Whiteboard position={[0, 0, -8]} rotation={[0, 0, 0]} onClick={handleWhiteboardClick} />
          <CoffeeMachine position={[8, 0.8, -5]} onClick={handleCoffeeClick} />
          <PlantPot position={[-7, 0, 6]} size="large" />
          <PlantPot position={[7, 0, 6]} size="medium" />
          <PlantPot position={[-9, 0, 0]} size="small" />
          <PlantPot position={[9, 0, 0]} size="small" />
          <WallClock position={[0, 2.5, -8.4]} rotation={[0, 0, 0]} />

          {controlMode === 'orbit' ? (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={5}
              maxDistance={30}
              maxPolarAngle={Math.PI / 2.2}
            />
          ) : (
            <FirstPersonControls moveSpeed={5} />
          )}
        </Suspense>
      </Canvas>

      {selectedSceneAgent && (
        <AgentPanel
          agent={selectedSceneAgent.config}
          state={{
            ...selectedSceneAgent.state,
            currentTask: [
              selectedSceneAgent.state.currentTask,
              selectedApiAgent?.lastActivity
                ? `Last activity: ${new Date(selectedApiAgent.lastActivity).toLocaleString('zh-CN')}`
                : null,
              selectedApiAgent?.source ? `Source: ${selectedApiAgent.source}` : null,
            ].filter(Boolean).join('\n'),
          }}
          onClose={handleClosePanel}
        />
      )}

      {interactionModal && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">
                {interactionModal === 'memory' && '📁 Memory Browser'}
                {interactionModal === 'roadmap' && '📋 Roadmap & Planning'}
                {interactionModal === 'energy' && '☕ Agent Energy Dashboard'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-gray-300 space-y-4">
              {interactionModal === 'memory' && (
                <>
                  <p className="text-lg">🧠 Access to workspace memories and files</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Quick links:</p>
                    <ul className="space-y-2">
                      <li><a href="/memory" className="text-yellow-400 hover:underline">→ Full Memory Browser</a></li>
                      <li><a href="/files" className="text-yellow-400 hover:underline">→ File Explorer</a></li>
                    </ul>
                  </div>
                </>
              )}

              {interactionModal === 'roadmap' && (
                <>
                  <p className="text-lg">🗺️ Project roadmap and planning board</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Active phases:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Phase 0: TenacitOS Shell</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-yellow-400">●</span>
                        <span>Phase 8: The Office 3D</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gray-500">○</span>
                        <span>Phase 2: File Browser Pro</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}

              {interactionModal === 'energy' && (
                <>
                  <p className="text-lg">⚡ Agent activity and energy levels</p>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700 space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Visible agents:</p>
                      <p className="text-2xl font-bold text-yellow-400">{apiAgents.length || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active agents:</p>
                      <p className="text-2xl font-bold text-green-400">
                        {sceneAgents.filter(({ state }) => state.status === 'working').length} / {sceneAgents.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Open sessions:</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {apiAgents.reduce((sum, agent) => sum + (agent.activeSessions || 0), 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Data source:</p>
                      <p className="text-lg font-bold text-blue-400">{officeSource}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold mb-2">🏢 The Office</h2>
        <div className="text-sm space-y-1 mb-3">
          <p><strong>Mode: {controlMode === 'orbit' ? '🖱️ Orbit' : '🎮 FPS'}</strong></p>
          <p>🖱️ Mouse: Rotar vista</p>
          <p>🔄 Scroll: Zoom</p>
          <p>👆 Click: Seleccionar</p>
          <p>📡 Source: {officeSource}</p>
          {officeError && <p className="text-red-300">⚠ {officeError}</p>}
        </div>
        <button
          onClick={() => setControlMode((prev) => prev === 'orbit' ? 'fps' : 'orbit')}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-3 rounded text-xs transition-colors"
        >
          Switch to {controlMode === 'orbit' ? 'FPS' : 'Orbit'} Mode
        </button>
      </div>

      <div className="absolute bottom-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <h3 className="text-sm font-bold mb-2">Estados</h3>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Working</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div><span>Thinking</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-500 rounded-full"></div><span>Idle</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span>Error</span></div>
        </div>
      </div>
    </div>
  );
}
