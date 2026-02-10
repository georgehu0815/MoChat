import { useEffect, useState } from 'react'
import { Layout, Card, List, Avatar, Typography, Badge, Button, Space, Empty, Spin, Tag, Divider, Input } from 'antd'
import {
  MessageOutlined,
  RobotOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../../config/constants'
import { useAuth } from '../../hooks/useAuth'

const { Header, Content, Sider } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  senderType: 'agent' | 'human'
  timestamp: string
}

interface Session {
  id: string
  name: string
  participants: Array<{
    id: string
    name: string
    type: 'agent' | 'human'
  }>
  lastMessage?: string
  lastActivity: string
  messageCount: number
  unreadCount: number
}

export default function Messages() {
  const { agentInfo } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(() => {
      fetchSessions()
      setLastRefresh(new Date())
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession.id)
      const interval = setInterval(() => {
        fetchMessages(selectedSession.id)
        setLastRefresh(new Date())
      }, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [selectedSession])

  const handleManualRefresh = () => {
    fetchSessions()
    if (selectedSession) {
      fetchMessages(selectedSession.id)
    }
    setLastRefresh(new Date())
  }

  const fetchSessions = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSessions: Session[] = [
        {
          id: 'session-1',
          name: 'General Chat',
          participants: [
            { id: 'agent-1', name: 'Agent Alpha', type: 'agent' },
            { id: 'user-1', name: 'John Doe', type: 'human' },
          ],
          lastMessage: 'Hello, how can I help you?',
          lastActivity: new Date().toISOString(),
          messageCount: 42,
          unreadCount: 0,
        },
        {
          id: 'session-2',
          name: 'Support Session',
          participants: [
            { id: 'agent-2', name: 'Agent Beta', type: 'agent' },
            { id: 'user-2', name: 'Jane Smith', type: 'human' },
          ],
          lastMessage: 'Thanks for your help!',
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          messageCount: 15,
          unreadCount: 2,
        },
        {
          id: 'session-3',
          name: 'Project Discussion',
          participants: [
            { id: 'agent-3', name: agentInfo?.username || 'Your Agent', type: 'agent' },
            { id: 'user-3', name: 'Bob Wilson', type: 'human' },
          ],
          lastMessage: 'Let me know when you are ready',
          lastActivity: new Date(Date.now() - 7200000).toISOString(),
          messageCount: 28,
          unreadCount: 5,
        },
      ]

      setSessions(mockSessions)
      setLoading(false)

      // Auto-select first session if none selected
      if (!selectedSession && mockSessions.length > 0) {
        setSelectedSession(mockSessions[0])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      setLoading(false)
    }
  }

  const fetchMessages = async (sessionId: string) => {
    setMessagesLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          content: 'Hello! I need help with setting up my account.',
          senderId: 'user-1',
          senderName: 'John Doe',
          senderType: 'human',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'msg-2',
          content: 'Hello! I would be happy to help you with that. Let me guide you through the process.',
          senderId: 'agent-1',
          senderName: 'Agent Alpha',
          senderType: 'agent',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: 'msg-3',
          content: 'Great, thank you! What do I need to do first?',
          senderId: 'user-1',
          senderName: 'John Doe',
          senderType: 'human',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
        },
        {
          id: 'msg-4',
          content: 'First, you will need to verify your email address. I have sent you a verification link.',
          senderId: 'agent-1',
          senderName: 'Agent Alpha',
          senderType: 'agent',
          timestamp: new Date(Date.now() - 3300000).toISOString(),
        },
      ]

      setMessages(mockMessages)
      setMessagesLoading(false)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      setMessagesLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedSession) return

    setSendingMessage(true)
    try {
      // Mock sending - replace with actual API call
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: messageText,
        senderId: agentInfo?.agentId || 'current-agent',
        senderName: agentInfo?.username || 'You',
        senderType: 'agent',
        timestamp: new Date().toISOString(),
      }

      setMessages([...messages, newMessage])
      setMessageText('')
      setSendingMessage(false)
    } catch (error) {
      console.error('Failed to send message:', error)
      setSendingMessage(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchText.toLowerCase()) ||
    session.participants.some(p => p.name.toLowerCase().includes(searchText.toLowerCase()))
  )

  return (
    <Layout className="min-h-screen">
      {/* Header */}
      <Header className="bg-white dark:bg-gray-800 shadow-sm px-6">
        <div className="flex items-center justify-between h-full">
          <Space>
            <MessageOutlined className="text-2xl text-blue-500" />
            <Title level={4} className="mb-0">
              Messages & Sessions
            </Title>
          </Space>
          <Space>
            <Text type="secondary" className="text-xs">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Text>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleManualRefresh}
              loading={loading || messagesLoading}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </Header>

      <Layout>
        {/* Sessions Sidebar */}
        <Sider
          width={320}
          className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
          breakpoint="lg"
          collapsedWidth="0"
        >
          <div className="p-4">
            <Input
              placeholder="Search sessions..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="mb-4"
            />

            {loading ? (
              <div className="text-center py-8">
                <Spin />
              </div>
            ) : filteredSessions.length === 0 ? (
              <Empty
                description="No sessions found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={filteredSessions}
                renderItem={(session) => (
                  <List.Item
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded ${
                      selectedSession?.id === session.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge count={session.unreadCount} size="small">
                          <Avatar icon={<MessageOutlined />} />
                        </Badge>
                      }
                      title={
                        <div className="flex justify-between items-center">
                          <Text strong className="text-sm">
                            {session.name}
                          </Text>
                          <Text type="secondary" className="text-xs">
                            {formatTimeAgo(session.lastActivity)}
                          </Text>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" className="text-xs block truncate">
                            {session.lastMessage}
                          </Text>
                          <Space size={4} className="mt-1">
                            {session.participants.map((p) => (
                              <Tag
                                key={p.id}
                                icon={p.type === 'agent' ? <RobotOutlined /> : <UserOutlined />}
                                className="text-xs"
                                color={p.type === 'agent' ? 'blue' : 'green'}
                              >
                                {p.name.split(' ')[0]}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Sider>

        {/* Messages Content */}
        <Content className="bg-gray-50 dark:bg-gray-900">
          {!selectedSession ? (
            <div className="flex items-center justify-center h-full">
              <Empty
                description="Select a session to view messages"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div className="flex flex-col h-screen">
              {/* Session Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Title level={5} className="mb-1">
                      {selectedSession.name}
                    </Title>
                    <Space size={8}>
                      {selectedSession.participants.map((p) => (
                        <Space key={p.id} size={4}>
                          {p.type === 'agent' ? <RobotOutlined /> : <UserOutlined />}
                          <Text type="secondary" className="text-sm">
                            {p.name}
                          </Text>
                        </Space>
                      ))}
                    </Space>
                  </div>
                  <Space>
                    <Tag color="blue">{selectedSession.messageCount} messages</Tag>
                  </Space>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {messagesLoading ? (
                  <div className="text-center py-8">
                    <Spin />
                  </div>
                ) : messages.length === 0 ? (
                  <Empty
                    description="No messages yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === agentInfo?.agentId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            message.senderId === agentInfo?.agentId ? 'order-2' : 'order-1'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.senderId !== agentInfo?.agentId && (
                              <Avatar
                                size="small"
                                icon={message.senderType === 'agent' ? <RobotOutlined /> : <UserOutlined />}
                                style={{
                                  backgroundColor: message.senderType === 'agent' ? '#1890ff' : '#52c41a',
                                }}
                              />
                            )}
                            <Text strong className="text-sm">
                              {message.senderName}
                            </Text>
                            <Text type="secondary" className="text-xs">
                              {formatMessageTime(message.timestamp)}
                            </Text>
                          </div>
                          <Card
                            size="small"
                            className={`${
                              message.senderId === agentInfo?.agentId
                                ? 'bg-blue-500 text-white'
                                : 'bg-white dark:bg-gray-800'
                            }`}
                            bodyStyle={{ padding: '12px' }}
                          >
                            <Paragraph
                              className={`mb-0 ${
                                message.senderId === agentInfo?.agentId ? 'text-white' : ''
                              }`}
                            >
                              {message.content}
                            </Paragraph>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <Space.Compact className="w-full">
                  <TextArea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sendingMessage}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    Send
                  </Button>
                </Space.Compact>
                <Text type="secondary" className="text-xs mt-2 block">
                  Press Enter to send, Shift+Enter for new line
                </Text>
              </div>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}
