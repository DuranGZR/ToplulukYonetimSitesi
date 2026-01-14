import { useEffect, useState, useMemo, useCallback } from 'react'
import Layout from '../components/Layout'
import api from '../services/api'

export default function LeaderboardPage() {
  const [users, setUsers] = useState([])
  const [pastMonths, setPastMonths] = useState([])
  const [activeTab, setActiveTab] = useState('current') // 'current' or 'past'
  const [loading, setLoading] = useState(true)

  const fetchCurrentLeaderboard = useCallback(async () => {
    try {
      const response = await api.get('/activity/current-month/')
      // Backend {leaderboard: [...], current_stars: [...]} formatında döndürüyor
      const leaderboardData = response.data.leaderboard || []
      setUsers(leaderboardData)
      setLoading(false)
    } catch (error) {
      console.error('Lider tablosu yüklenemedi:', error)
      setLoading(false)
    }
  }, [])

  const fetchPastMonths = useCallback(async () => {
    try {
      const response = await api.get('/activity/past-months/')
      setPastMonths(response.data)
    } catch (error) {
      console.error('Geçmiş aylar yüklenemedi:', error)
    }
  }, [])

  useEffect(() => {
    fetchCurrentLeaderboard()
    fetchPastMonths()
  }, [fetchCurrentLeaderboard, fetchPastMonths])

  const getMedalIcon = (rank) => {
    if (rank === 0) return '🥇' // Gold
    if (rank === 1) return '🥈' // Silver
    if (rank === 2) return '🥉' // Bronze
    return ''
  }

  const getRankColor = (rank) => {
    if (rank === 0) return 'from-yellow-400 via-yellow-500 to-yellow-600'
    if (rank === 1) return 'from-gray-300 via-gray-400 to-gray-500'
    if (rank === 2) return 'from-orange-400 via-orange-500 to-orange-600'
    return 'from-gray-700 to-gray-800'
  }

  const getRankBorderColor = (rank) => {
    if (rank === 0) return 'border-yellow-500/50'
    if (rank === 1) return 'border-gray-400/50'
    if (rank === 2) return 'border-orange-500/50'
    return 'border-gray-700'
  }

  const topThree = useMemo(() => users.slice(0, 3), [users])
  const others = useMemo(() => users.slice(3), [users])

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8 px-2 sm:px-4 pb-4 sm:pb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 text-white px-2 sm:px-4">
            Lider Tablosu
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">En çok puan kazanan topluluk üyeleri</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'current'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Bu Ay
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Geçmiş Aylar
          </button>
        </div>

        {activeTab === 'current' ? (
          <>
            {loading ? (
              <div className="flex justify-center items-center py-10 sm:py-16 md:py-20">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-red-400 border-t-transparent rounded-full animate-ping opacity-20"></div>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 sm:py-16 md:py-20">
                <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-2">Henüz lider tablosu yok</p>
                <p className="text-xs sm:text-sm text-gray-500">Puan kazanan ilk kişi sen ol!</p>
              </div>
            ) : (
              <div>
            {/* Podium - Top 3 */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-2 md:px-4" style={{ animation: 'slideUp 0.5s ease-out 0.1s backwards' }}>
                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="sm:mt-8 md:mt-12">
                    <div className="relative group hover:scale-105 transition-transform duration-300">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(1)} opacity-20 blur-xl group-hover:opacity-30 transition-opacity rounded-2xl`}></div>
                      <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 md:p-4 lg:p-6 border-2 ${getRankBorderColor(1)} hover:shadow-2xl transition-all`}>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl md:text-4xl lg:text-6xl mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">{getMedalIcon(1)}</div>
                          {topThree[1].profile_image ? (
                            <img 
                              src={`http://127.0.0.1:8000${topThree[1].profile_image}`}
                              alt={topThree[1].full_name}
                              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 rounded-full object-cover shadow-lg border-2 sm:border-3 md:border-4 border-gray-300"
                            />
                          ) : (
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 bg-gradient-to-br ${getRankColor(1)} rounded-full flex items-center justify-center text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-white shadow-lg`}>
                              {topThree[1].full_name?.charAt(0)}
                            </div>
                          )}
                          <h3 className="font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl mb-0.5 sm:mb-1 leading-tight">{topThree[1].full_name}</h3>
                          <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 mb-1 sm:mb-2 md:mb-3 lg:mb-4 hidden sm:block">{topThree[1].department || '-'}</p>
                          <div className="flex justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                            <div className="text-center">
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">Puan</p>
                              <p className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{topThree[1].monthly_points || 0}</p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-gray-300 to-gray-500 text-black font-bold py-0.5 sm:py-1 md:py-1.5 lg:py-2 px-1 sm:px-2 md:px-3 lg:px-4 rounded-full inline-block text-[8px] sm:text-[10px] md:text-xs lg:text-sm">
                            2. Sıra
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1st Place - Champion */}
                {topThree[0] && (
                  <div>
                    <div className="relative group hover:scale-105 transition-transform duration-300">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(0)} opacity-30 blur-2xl group-hover:opacity-40 transition-opacity rounded-2xl`}></div>
                      <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 md:p-4 lg:p-6 border-2 ${getRankBorderColor(0)} hover:shadow-2xl transition-all`}>
                        <div className="absolute -top-1 sm:-top-2 md:-top-3 lg:-top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-red-600 text-white font-bold py-0.5 px-1 sm:px-2 md:px-3 lg:px-4 rounded-full text-[8px] sm:text-[10px] md:text-xs lg:text-sm shadow-lg">
                            Şampiyon
                          </div>
                        </div>
                        <div className="text-center pt-1.5 sm:pt-2 md:pt-3 lg:pt-4">
                          <div className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl mb-1 sm:mb-1.5 md:mb-2 lg:mb-3 animate-bounce">{getMedalIcon(0)}</div>
                          {topThree[0].profile_image ? (
                            <img 
                              src={`http://127.0.0.1:8000${topThree[0].profile_image}`}
                              alt={topThree[0].full_name}
                              className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 rounded-full object-cover shadow-2xl border-2 sm:border-3 md:border-4 border-yellow-300"
                            />
                          ) : (
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 bg-gradient-to-br ${getRankColor(0)} rounded-full flex items-center justify-center text-xs sm:text-sm md:text-xl lg:text-2xl xl:text-3xl font-bold text-white shadow-2xl border-2 sm:border-3 md:border-4 border-yellow-300`}>
                              {topThree[0].full_name?.charAt(0)}
                            </div>
                          )}
                          <h3 className="font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl mb-0.5 sm:mb-1 leading-tight">{topThree[0].full_name}</h3>
                          <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 mb-1 sm:mb-2 md:mb-3 lg:mb-4 hidden sm:block">{topThree[0].department || '-'}</p>
                          <div className="flex justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-5 xl:gap-6 mb-1 sm:mb-2 md:mb-3 lg:mb-4">
                            <div className="text-center">
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">Puan</p>
                              <p className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{topThree[0].monthly_points || 0}</p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold py-0.5 sm:py-1 md:py-1.5 lg:py-2 px-2 sm:px-3 md:px-4 lg:px-6 rounded-full inline-block text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base">
                            1. Sıra
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="sm:mt-8 md:mt-12">
                    <div className="relative group hover:scale-105 transition-transform duration-300">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(2)} opacity-20 blur-xl group-hover:opacity-30 transition-opacity rounded-2xl`}></div>
                      <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 md:p-4 lg:p-6 border-2 ${getRankBorderColor(2)} hover:shadow-2xl transition-all`}>
                        <div className="text-center">
                          <div className="text-xl sm:text-2xl md:text-4xl lg:text-6xl mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">{getMedalIcon(2)}</div>
                          {topThree[2].profile_image ? (
                            <img 
                              src={`http://127.0.0.1:8000${topThree[2].profile_image}`}
                              alt={topThree[2].full_name}
                              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 rounded-full object-cover shadow-lg border-2 sm:border-3 md:border-4 border-orange-300"
                            />
                          ) : (
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 bg-gradient-to-br ${getRankColor(2)} rounded-full flex items-center justify-center text-xs sm:text-sm md:text-lg lg:text-2xl font-bold text-white shadow-lg`}>
                              {topThree[2].full_name?.charAt(0)}
                            </div>
                          )}
                          <h3 className="font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl mb-0.5 sm:mb-1 leading-tight">{topThree[2].full_name}</h3>
                          <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-400 mb-1 sm:mb-2 md:mb-3 lg:mb-4 hidden sm:block">{topThree[2].department || '-'}</p>
                          <div className="flex justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 mb-1 sm:mb-1.5 md:mb-2 lg:mb-3">
                            <div className="text-center">
                              <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-500">Puan</p>
                              <p className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{topThree[2].monthly_points || 0}</p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold py-0.5 sm:py-1 md:py-1.5 lg:py-2 px-1 sm:px-2 md:px-3 lg:px-4 rounded-full inline-block text-[8px] sm:text-[10px] md:text-xs lg:text-sm">
                            3. Sıra
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other Ranks */}
            {others.length > 0 && (
              <div>
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 md:mb-4">
                  Diğer Sıralamalar
                </h2>
                <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
                  {others.map((user, index) => {
                    const actualRank = index + 3
                    return (
                      <div
                        key={user.id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg sm:rounded-xl p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 border border-gray-700 shadow-lg hover:shadow-xl hover:scale-[1.01] sm:hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                        style={{ animation: `slideUp 0.3s ease-out ${0.1 + index * 0.05}s backwards` }}
                      >
                        <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl border-2 border-gray-600 flex-shrink-0">
                              {actualRank + 1}
                            </div>
                            {user.profile_image ? (
                              <img 
                                src={`http://127.0.0.1:8000${user.profile_image}`}
                                alt={user.full_name}
                                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 rounded-full object-cover border-2 border-red-600 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-xs sm:text-sm md:text-base lg:text-lg font-bold flex-shrink-0">
                                {user.full_name?.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xs sm:text-sm md:text-base lg:text-lg truncate">{user.full_name}</h3>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:block">{user.department || 'Bölüm belirtilmemiş'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-[10px] sm:text-xs text-gray-500">Puan</p>
                              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">{user.monthly_points || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
              </div>
            )}
          </>
        ) : (
          /* Past Months */
          <div className="space-y-4">
            {pastMonths.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400">Henüz geçmiş ay verisi yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastMonths.map((month) => (
                  <div key={month.id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{month.month_name}</h3>
                      <span className="text-3xl">⭐</span>
                    </div>
                    <div className="space-y-3">
                      {month.winner_details.slice(0, 3).map((winner, idx) => (
                        <div key={winner.id} className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
                          <img 
                            src={winner.profile_image || '/default-avatar.png'} 
                            alt={`${winner.first_name} ${winner.last_name}`}
                            className="w-12 h-12 rounded-full border-2 border-yellow-500"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-white">{winner.first_name} {winner.last_name}</p>
                            <p className="text-sm text-gray-400">{month.leaderboard_snapshot[idx]?.points || 0} puan</p>
                          </div>
                          {idx === 0 && <span className="text-xl">🏆</span>}
                        </div>
                      ))}
                      {month.winner_details.length > 3 && (
                        <p className="text-center text-gray-400 text-sm">+{month.winner_details.length - 3} kazanan daha</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
