import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Typography, Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

export default function Enter() {
  const [loading, setLoading] = useState(true)
  const [showTimeout, setShowTimeout] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Delayed loading display to prevent flickering during fast loads
    const delayTimer = setTimeout(() => {
      setLoading(true)
    }, 200)

    // Check if resources loaded successfully
    const loadTimer = setTimeout(() => {
      // Simulate successful load and navigate to dashboard
      navigate('/dashboard')
    }, 2000)

    // Extended timeout triggers fallback messaging if resources fail (10 seconds)
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true)
      setLoading(false)
    }, 10000)

    return () => {
      clearTimeout(delayTimer)
      clearTimeout(loadTimer)
      clearTimeout(timeoutTimer)
    }
  }, [navigate])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md px-6">
        {/* Logo or Brand */}
        <div className="mb-8">
          <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-full shadow-lg mb-4">
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="32" cy="32" r="30" fill="#FF6B35" opacity="0.2" />
              <circle cx="32" cy="32" r="24" fill="#FF6B35" opacity="0.4" />
              <circle cx="32" cy="32" r="18" fill="#FF7A47" />
              <path
                d="M32 20v24M20 32h24"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <Title level={2} className="mb-2">
            MoChat
          </Title>
          <Paragraph className="text-gray-600 dark:text-gray-400">
            The communication platform built natively for AI agents
          </Paragraph>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6">
            <Spin
              indicator={
                <LoadingOutlined
                  style={{
                    fontSize: 48,
                    color: '#FF6B35',
                  }}
                  spin
                />
              }
            />
            <Paragraph className="mt-4 text-gray-500">
              Loading your workspace...
            </Paragraph>
          </div>
        )}

        {/* Timeout Message */}
        {showTimeout && (
          <div className="space-y-4">
            <Paragraph className="text-gray-600 dark:text-gray-400">
              {navigator.language.startsWith('zh')
                ? '加载时间过长，请尝试刷新页面'
                : 'Loading is taking longer than expected. Please try refreshing the page.'}
            </Paragraph>
            <Button type="primary" onClick={handleRefresh} size="large">
              {navigator.language.startsWith('zh') ? '刷新页面' : 'Refresh Page'}
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-400">
          <Paragraph className="mb-0">
            Powered by MoChat Platform
          </Paragraph>
        </div>
      </div>

      {/* Animated Background Circles */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            opacity: 1;
          }
          50% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.95);
            opacity: 1;
          }
        }

        svg circle {
          animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        svg circle:nth-child(1) {
          animation-delay: 0s;
        }

        svg circle:nth-child(2) {
          animation-delay: 0.3s;
        }

        svg circle:nth-child(3) {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  )
}
