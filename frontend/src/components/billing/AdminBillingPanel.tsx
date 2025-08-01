import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  subscriptionType: 'FREE' | 'PAID';
  balance: number;
  subscriptionStatus: 'ACTIVE' | 'INSUFFICIENT_BALANCE';
  canAffordNextMonth: boolean;
}

interface BillingStats {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalBalance: number;
  monthlyRevenue: number;
  usersWithLowBalance: number;
}

interface BillingSettings {
  monthlyCost: number;
  currencyName: string;
}

interface AdminBillingPanelProps {
  users: User[];
  stats: BillingStats;
  settings: BillingSettings;
  onAddBalance: (userId: number, amount: number, description?: string) => Promise<void>;
  onStartPaidSubscription: (userId: number) => Promise<void>;
  onProcessBilling: () => Promise<void>;
  onRefresh: () => void;
}

export const AdminBillingPanel: React.FC<AdminBillingPanelProps> = ({
  users,
  stats,
  settings,
  onAddBalance,
  onStartPaidSubscription,
  onProcessBilling,
  onRefresh,
}) => {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [balanceDescription, setBalanceDescription] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddBalance = async () => {
    if (!selectedUser || !balanceAmount) return;
    
    const amount = parseInt(balanceAmount);
    if (amount <= 0) return;

    try {
      setIsProcessing(true);
      await onAddBalance(selectedUser, amount, balanceDescription || undefined);
      setBalanceAmount('');
      setBalanceDescription('');
      setSelectedUser(null);
      onRefresh();
    } catch (error) {
      console.error('Error adding balance:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartPaidSubscription = async (userId: number) => {
    try {
      setIsProcessing(true);
      await onStartPaidSubscription(userId);
      onRefresh();
    } catch (error) {
      console.error('Error starting paid subscription:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessBilling = async () => {
    try {
      setIsProcessing(true);
      await onProcessBilling();
      onRefresh();
    } catch (error) {
      console.error('Error processing billing:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50';
      case 'INSUFFICIENT_BALANCE':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSubscriptionTypeColor = (type: string) => {
    switch (type) {
      case 'FREE':
        return 'text-blue-600 bg-blue-50';
      case 'PAID':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Статистика биллинга</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleProcessBilling}
              disabled={isProcessing}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isProcessing ? 'Обработка...' : 'Запустить биллинг'}
            </button>
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-sm text-gray-500">Всего пользователей</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.paidUsers}</div>
            <div className="text-sm text-gray-500">Платных</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.blockedUsers}</div>
            <div className="text-sm text-gray-500">Заблокированных</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalBalance}</div>
            <div className="text-sm text-gray-500">{settings.currencyName} общий баланс</div>
          </div>
        </div>
      </div>

      {/* Balance Management */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Управление балансом</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Пользователь</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Выберите пользователя</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Сумма</label>
            <input
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              placeholder="Введите сумму"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Описание</label>
            <input
              type="text"
              value={balanceDescription}
              onChange={(e) => setBalanceDescription(e.target.value)}
              placeholder="Необязательно"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleAddBalance}
              disabled={!selectedUser || !balanceAmount || isProcessing}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Пополнить баланс
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Пользователи</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип подписки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Баланс
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionTypeColor(user.subscriptionType)}`}>
                      {user.subscriptionType === 'FREE' ? 'Бесплатная' : 'Платная'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${user.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {user.balance} {settings.currencyName}
                    </div>
                    {user.subscriptionType === 'PAID' && !user.canAffordNextMonth && (
                      <div className="text-xs text-red-500">Недостаточно средств</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.subscriptionStatus)}`}>
                      {user.subscriptionStatus === 'ACTIVE' ? 'Активна' : 'Заблокирована'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.subscriptionType === 'FREE' && (
                      <button
                        onClick={() => handleStartPaidSubscription(user.id)}
                        disabled={isProcessing}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      >
                        Включить платную подписку
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};