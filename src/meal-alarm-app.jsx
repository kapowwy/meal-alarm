import React, { useState, useEffect } from 'react';
import { Clock, Bell, Settings, Plus, X, Check, AlarmClockOff } from 'lucide-react';

const MealAlarmApp = () => {
  const [currentView, setCurrentView] = useState('main');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [country, setCountry] = useState('Thailand');
  
  // Timezone mapping for countries
  const timezones = {
    'Thailand': 'Asia/Bangkok',
    'USA': 'America/New_York',
    'Japan': 'Asia/Tokyo',
    'UK': 'Europe/London',
    'Germany': 'Europe/Berlin',
    'Australia': 'Australia/Sydney'
  };
  
  const [alarms, setAlarms] = useState([
    { id: 1, time: '09:00', label: 'Breakfast Time!', enabled: true },
    { id: 2, time: '13:00', label: 'Lunch Time!', enabled: true },
    { id: 3, time: '18:00', label: 'Dinner Time!', enabled: true }
  ]);
  const [editingAlarm, setEditingAlarm] = useState(null);
  const [alarmTriggered, setAlarmTriggered] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [currentFoodIcon, setCurrentFoodIcon] = useState('🍛');

  const foodIcons = ['🍳', '🍔', '🍕', '🍣', '🍜', '🥗', '🍝', '🌮', '🥘', '🍲', '🥙', '🍛', '🥞', '🧇', '🍞', '🍖', '🍗', '🥩', '🍤', '🦐'];

  // Helper function to get current time in selected country
  const getCurrentTimeInCountry = () => {
    const timezone = timezones[country];
    const options = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Date().toLocaleTimeString('en-US', options);
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentSeconds = now.getSeconds();
      
      // Only trigger at exactly 0 seconds to avoid multiple triggers
      if (currentSeconds === 0) {
        alarms.forEach(alarm => {
          if (alarm.enabled && alarm.time === currentTimeStr && !alarmTriggered) {
            triggerAlarm(alarm);
          }
        });
      }
    };

    const timer = setInterval(checkAlarms, 1000);
    return () => clearInterval(timer);
  }, [alarms, alarmTriggered]);

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const triggerAlarm = (alarm) => {
    setAlarmTriggered(alarm);
    setCurrentView('alarm-ringing');
    
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('Time to Eat! <3', {
        body: `It's time for ${alarm.label}!`,
        icon: '🍽️',
        requireInteraction: true
      });
    }
    
    // Play alarm sound (looping)
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    audio.loop = true;
    audio.play().catch(() => {});
    setAudioElement(audio);
  };

  const snoozeAlarm = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
    // Create a new alarm 5 minutes from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const snoozeAlarm = {
      id: Date.now(),
      time: snoozeTime,
      label: `${alarmTriggered.label} (Snoozed)`,
      enabled: true
    };
    
    setAlarms([...alarms, snoozeAlarm]);
    setAlarmTriggered(null);
    setCurrentView('main');
  };

  const stopAlarm = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setAlarmTriggered(null);
    setCurrentView('main');
  };

  const getNextMealTime = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return null;

    const sortedAlarms = enabledAlarms.map(alarm => {
      const [hours, minutes] = alarm.time.split(':').map(Number);
      const alarmMinutes = hours * 60 + minutes;
      let diff = alarmMinutes - currentMinutes;
      if (diff < 0) diff += 24 * 60; // Next day
      return { ...alarm, diff };
    }).sort((a, b) => a.diff - b.diff);

    return sortedAlarms[0];
  };

  const toggleAlarm = (id) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
    ));
  };

  const addNewAlarm = () => {
    const newAlarm = {
      id: Date.now(),
      time: '12:00',
      label: 'New Meal',
      enabled: false
    };
    setAlarms([...alarms, newAlarm]);
    setEditingAlarm(newAlarm);
  };

  const deleteAlarm = (id) => {
    setAlarms(alarms.filter(alarm => alarm.id !== id));
    if (editingAlarm?.id === id) setEditingAlarm(null);
  };

  const saveEditingAlarm = () => {
    if (editingAlarm) {
      setAlarms(alarms.map(alarm => 
        alarm.id === editingAlarm.id ? editingAlarm : alarm
      ));
    }
    setEditingAlarm(null);
    setCurrentView('alarms');
  };

  const randomizeFoodIcon = () => {
    const newIcon = foodIcons[Math.floor(Math.random() * foodIcons.length)];
    setCurrentFoodIcon(newIcon);
  };

  // Main Clock View
  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-amber-50 p-4 flex items-center justify-center">
        <div className="bg-yellow-100 border-4 border-amber-800 rounded-lg p-6 w-full max-w-sm relative" style={{ boxShadow: '8px 8px 0px rgba(120, 53, 15, 0.3)' }}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-amber-900 font-bold text-lg">TIME TO EAT &lt;3</h1>
            <div className="flex gap-2">
              <button 
                className="w-8 h-8 bg-orange-300 border-2 border-amber-800 rounded flex items-center justify-center hover:bg-orange-400 transition-colors"
                onClick={() => setCurrentView('settings')}
              >
                <Settings className="w-5 h-5 text-amber-900" />
              </button>
              <button 
                className="w-8 h-8 bg-yellow-300 border-2 border-amber-800 rounded"
              ></button>
              <button 
                className="w-8 h-8 bg-red-300 border-2 border-amber-800 rounded"
              ></button>
            </div>
          </div>

          <div className="bg-yellow-50 border-4 border-amber-800 rounded-lg p-6 relative overflow-hidden" style={{ minHeight: '450px' }}>
            {/* Heart pattern background */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 45c-1-1-15-12-15-22 0-6 4-10 9-10 3 0 5 1 6 3 1-2 3-3 6-3 5 0 9 4 9 10 0 10-14 21-15 22z' fill='%23d97706' /%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-white bg-opacity-50 border-2 border-amber-800 rounded-lg px-3 py-1">
                  <span className="text-amber-900 text-sm font-semibold">[{country}]</span>
                </div>
                <button 
                  onClick={() => setCurrentView('alarms')}
                  className="bg-orange-200 border-2 border-amber-800 rounded-lg p-2 hover:bg-orange-300 transition-colors"
                >
                  <Bell className="w-5 h-5 text-amber-900" />
                </button>
              </div>

              <div className="text-center my-8">
                <div className="text-8xl font-bold text-amber-900" style={{ fontFamily: 'monospace', letterSpacing: '-0.05em' }}>
                  {getCurrentTimeInCountry()}
                </div>
              </div>

              <div className="flex flex-col items-center mt-12">
                <button 
                  onClick={randomizeFoodIcon}
                  className="relative group cursor-pointer"
                  title="Click for food idea!"
                >
                  <div className="text-8xl transition-transform hover:scale-110 active:scale-95">
                    {currentFoodIcon}
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-white/40 rounded-full blur-sm"></div>
                </button>
                
                <div className="mt-4">
                  <div className="bg-orange-200 border-2 border-amber-800 rounded-full px-6 py-2">
                    <span className="text-amber-900 font-bold">Food Idea!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Alarm Ringing View
  if (currentView === 'alarm-ringing' && alarmTriggered) {
    return (
      <div className="min-h-screen bg-red-50 p-4 flex items-center justify-center animate-pulse">
        <div className="bg-yellow-100 border-4 border-red-600 rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '8px 8px 0px rgba(220, 38, 38, 0.5)' }}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-red-700 font-bold text-lg">TIME TO EAT &lt;3</h1>
            <div className="flex gap-2">
              <button className="w-6 h-6 bg-red-400 border-2 border-red-700 rounded animate-pulse"></button>
              <button className="w-6 h-6 bg-red-400 border-2 border-red-700 rounded animate-pulse"></button>
              <button className="w-6 h-6 bg-red-400 border-2 border-red-700 rounded animate-pulse"></button>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="animate-bounce">
              <Bell className="w-24 h-24 text-red-600 mx-auto" />
            </div>
            
            <h2 className="text-red-700 text-3xl font-bold">TIME TO EAT!</h2>
            
            <div className="bg-red-100 border-2 border-red-600 rounded-lg p-4">
              <p className="text-red-700 text-xl font-bold">{alarmTriggered.label}</p>
              <p className="text-red-600 text-lg mt-2">{alarmTriggered.time}</p>
            </div>

            <div className="flex gap-4 justify-center mt-8">
              <button
                onClick={snoozeAlarm}
                className="bg-yellow-300 border-2 border-amber-800 rounded-lg px-6 py-3 hover:bg-yellow-400 transition-colors"
              >
                <div className="text-amber-900 font-bold">Snooze</div>
                <div className="text-amber-900 text-sm">+5 min</div>
              </button>
              
              <button
                onClick={stopAlarm}
                className="bg-green-300 border-2 border-amber-800 rounded-lg px-6 py-3 hover:bg-green-400 transition-colors"
              >
                <div className="text-amber-900 font-bold">Stop</div>
                <div className="text-amber-900 text-sm">✓</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Settings View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-amber-50 p-4 flex items-center justify-center">
        <div className="bg-yellow-100 border-4 border-amber-800 rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '8px 8px 0px rgba(120, 53, 15, 0.3)' }}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-amber-900 font-bold text-lg">TIME TO EAT &lt;3</h1>
            <div className="flex gap-2">
              <button className="w-6 h-6 bg-orange-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-yellow-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-red-300 border-2 border-amber-800 rounded"></button>
            </div>
          </div>

          <h2 className="text-amber-900 text-xl font-bold text-center mb-6">SETTINGS</h2>

          <div className="space-y-4">
            <div className="bg-yellow-50 border-2 border-amber-800 rounded-lg p-4">
              <p className="text-amber-900 font-semibold mb-2">Change country</p>
              <div className="bg-orange-200 border-2 border-amber-800 rounded-full px-4 py-2 relative cursor-pointer">
                <span className="text-amber-900">{country}</span>
                <select 
                  className="absolute opacity-0 w-full h-full left-0 top-0 cursor-pointer"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option>Thailand</option>
                  <option>USA</option>
                  <option>Japan</option>
                  <option>UK</option>
                  <option>France</option>
                  <option>Germany</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-amber-800 rounded-lg p-4">
              <p className="text-amber-900 font-semibold mb-2">Change alarm</p>
              <div className="bg-orange-200 border-2 border-amber-800 rounded-full px-4 py-2">
                <span className="text-amber-900">Sound (default)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setCurrentView('main')}
              className="bg-blue-200 border-2 border-amber-800 rounded-lg p-2 hover:bg-blue-300 transition-colors"
            >
              <X className="w-6 h-6 text-amber-900" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Alarms View
  if (currentView === 'alarms' && !editingAlarm) {
    return (
      <div className="min-h-screen bg-amber-50 p-4 flex items-center justify-center">
        <div className="bg-yellow-100 border-4 border-amber-800 rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '8px 8px 0px rgba(120, 53, 15, 0.3)' }}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-amber-900 font-bold text-lg">TIME TO EAT &lt;3</h1>
            <div className="flex gap-2">
              <button className="w-6 h-6 bg-orange-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-yellow-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-red-300 border-2 border-amber-800 rounded"></button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-amber-900 text-xl font-bold">ALARMS</h2>
            <button 
              onClick={addNewAlarm}
              className="bg-orange-300 border-2 border-amber-800 rounded-lg p-2 hover:bg-orange-400 transition-colors"
            >
              <Plus className="w-5 h-5 text-amber-900" />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alarms.map(alarm => (
              <div 
                key={alarm.id}
                className="bg-yellow-50 border-2 border-amber-800 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={() => setEditingAlarm(alarm)}
              >
                <div className="flex flex-col">
                  <span className="text-amber-900 text-2xl font-bold">{alarm.time}</span>
                  <span className="text-amber-900 text-sm">{alarm.label}</span>
                </div>
                <label className="relative inline-block w-12 h-6 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={alarm.enabled}
                    onChange={() => toggleAlarm(alarm.id)}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className={`absolute inset-0 rounded-full transition-colors ${alarm.enabled ? 'bg-green-400' : 'bg-gray-300'} border-2 border-amber-800`}>
                    <span className={`absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${alarm.enabled ? 'translate-x-6' : ''}`}></span>
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setCurrentView('main')}
              className="bg-blue-200 border-2 border-amber-800 rounded-lg p-2 hover:bg-blue-300 transition-colors"
            >
              <X className="w-6 h-6 text-amber-900" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit Alarm View
  if (editingAlarm) {
    return (
      <div className="min-h-screen bg-amber-50 p-4 flex items-center justify-center">
        <div className="bg-yellow-100 border-4 border-amber-800 rounded-lg p-6 w-full max-w-sm" style={{ boxShadow: '8px 8px 0px rgba(120, 53, 15, 0.3)' }}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-amber-900 font-bold text-lg">TIME TO EAT &lt;3</h1>
            <div className="flex gap-2">
              <button className="w-6 h-6 bg-orange-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-yellow-300 border-2 border-amber-800 rounded"></button>
              <button className="w-6 h-6 bg-red-300 border-2 border-amber-800 rounded"></button>
            </div>
          </div>

          <h2 className="text-amber-900 text-xl font-bold text-center mb-6">EDIT ALARM</h2>

          <div className="text-center mb-6">
            <input
              type="time"
              value={editingAlarm.time}
              onChange={(e) => setEditingAlarm({...editingAlarm, time: e.target.value})}
              className="text-7xl font-bold text-amber-900 bg-transparent border-none text-center w-full"
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          <div className="mb-6">
            <label className="block text-amber-900 font-semibold mb-2">Label:</label>
            <input
              type="text"
              value={editingAlarm.label}
              onChange={(e) => setEditingAlarm({...editingAlarm, label: e.target.value})}
              className="w-full bg-yellow-50 border-2 border-amber-800 rounded-lg px-4 py-2 text-amber-900"
              placeholder="e.g., Breakfast"
            />
          </div>

          <div className="flex gap-4 justify-center">
            <button 
              onClick={saveEditingAlarm}
              className="bg-green-300 border-2 border-amber-800 rounded-lg p-3 hover:bg-green-400 transition-colors"
            >
              <Check className="w-6 h-6 text-amber-900" />
            </button>
            <button 
              onClick={() => {
                setEditingAlarm(null);
                setCurrentView('alarms');
              }}
              className="bg-gray-300 border-2 border-amber-800 rounded-lg p-3 hover:bg-gray-400 transition-colors"
            >
              <X className="w-6 h-6 text-amber-900" />
            </button>
            <button 
              onClick={() => {
                deleteAlarm(editingAlarm.id);
                setCurrentView('alarms');
              }}
              className="bg-red-300 border-2 border-amber-800 rounded-lg p-3 hover:bg-red-400 transition-colors"
            >
              <AlarmClockOff className="w-6 h-6 text-amber-900" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default MealAlarmApp;