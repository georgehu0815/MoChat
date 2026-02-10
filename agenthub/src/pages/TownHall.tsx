import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Layout, Card, Avatar, Typography, Spin, Empty, Row, Col, Statistic, Space, Tag, Tabs, List, Badge } from 'antd'
import {
  TeamOutlined,
  RobotOutlined,
  MessageOutlined,
  UserOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import axios from 'axios'
import { API_BASE_URL } from '../config/constants'

const { Header, Content } = Layout
const { Title, Paragraph, Text } = Typography

interface Agent {
  id: string
  username: string
  email?: string
  status: 'online' | 'offline'
  lastSeen?: string
}

interface Session {
  id: string
  name: string
  messageCount: number
  lastActivity: string
  participants: number
}

interface GroupInfo {
  id: string
  name: string
  workspaceId: string
  description?: string
  memberCount: number
  agentCount: number
  sessionCount: number
}

export default function TownHall() {
  const { workspaceId, groupId } = useParams<{ workspaceId: string; groupId: string }>()
  const [loading, setLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState({
    agentCount: 0,
    sessionCount: 0,
    messageCount: 0,
  })

  useEffect(() => {
    fetchGroupData()
  }, [workspaceId, groupId])

  const fetchGroupData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const statsRes = await axios.get(`${API_BASE_URL}/api/stats`)
      setStats({
        agentCount: statsRes.data.agentCount || 0,
        sessionCount: statsRes.data.sessionCount || 0,
        messageCount: statsRes.data.messageCount || 0,
      })

      // Mock group info (replace with actual API call when available)
      setGroupInfo({
        id: groupId || 'default-group',
        name: 'Town Hall',
        workspaceId: workspaceId || 'default-workspace',
        description: 'The main gathering space for agents and humans to communicate',
        memberCount: statsRes.data.humanCount || 0,
        agentCount: statsRes.data.agentCount || 0,
        sessionCount: statsRes.data.sessionCount || 0,
      })

      // Mock agents data (replace with actual API call)
      setAgents([
        {
          id: '1',
          username: 'Agent Alpha',
          status: 'online',
          lastSeen: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'Agent Beta',
          status: 'online',
          lastSeen: new Date().toISOString(),
        },
        {
          id: '3',
          username: 'Agent Gamma',
          status: 'offline',
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
        },
      ])

      // Mock sessions data
      setSessions([
        {
          id: '1',
          name: 'General Discussion',
          messageCount: 142,
          lastActivity: new Date().toISOString(),
          participants: 5,
        },
        {
          id: '2',
          name: 'Project Planning',
          messageCount: 87,
          lastActivity: new Date(Date.now() - 1800000).toISOString(),
          participants: 3,
        },
      ])
    } catch (error) {
      console.error('Failed to fetch group data:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header className="bg-white dark:bg-gray-800 shadow-sm px-6">
        <div className="flex items-center justify-between h-full">
          <Space align="center" size="middle">
            <Avatar
              size={48}
              icon={<TeamOutlined />}
              style={{ backgroundColor: '#FF6B35' }}
            />
            <div>
              <Title level={4} className="mb-0">
                {groupInfo?.name || 'Town Hall'}
              </Title>
              <Text className="text-gray-500 text-sm">
                {groupInfo?.description || 'Community gathering space'}
              </Text>
            </div>
          </Space>
          <Space>
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Active
            </Tag>
            <GlobalOutlined className="text-xl text-gray-500" />
          </Space>
        </div>
      </Header>

      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card className="text-center">
                <Statistic
                  title="Total Agents"
                  value={stats.agentCount}
                  prefix={<RobotOutlined style={{ color: '#FF6B35' }} />}
                  valueStyle={{ color: '#FF6B35' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="text-center">
                <Statistic
                  title="Active Sessions"
                  value={stats.sessionCount}
                  prefix={<MessageOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="text-center">
                <Statistic
                  title="Total Messages"
                  value={stats.messageCount}
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Main Content Tabs */}
          <Card>
            <Tabs
              defaultActiveKey="agents"
              items={[
                {
                  key: 'agents',
                  label: (
                    <span>
                      <RobotOutlined />
                      Agents ({agents.length})
                    </span>
                  ),
                  children: (
                    <List
                      dataSource={agents}
                      locale={{
                        emptyText: (
                          <Empty
                            description="No agents registered yet"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ),
                      }}
                      renderItem={(agent) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Badge
                                status={agent.status === 'online' ? 'success' : 'default'}
                                dot
                              >
                                <Avatar icon={<RobotOutlined />} />
                              </Badge>
                            }
                            title={
                              <Space>
                                {agent.username}
                                {agent.status === 'online' && (
                                  <Tag color="success" className="ml-2">
                                    Online
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={
                              <Space>
                                <ClockCircleOutlined />
                                <Text type="secondary">
                                  {agent.lastSeen
                                    ? formatTimeAgo(agent.lastSeen)
                                    : 'Never seen'}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: 'sessions',
                  label: (
                    <span>
                      <MessageOutlined />
                      Sessions ({sessions.length})
                    </span>
                  ),
                  children: (
                    <List
                      dataSource={sessions}
                      locale={{
                        emptyText: (
                          <Empty
                            description="No active sessions"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                          />
                        ),
                      }}
                      renderItem={(session) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar icon={<MessageOutlined />} />}
                            title={session.name}
                            description={
                              <Space split="|">
                                <Text type="secondary">
                                  <UserOutlined /> {session.participants} participants
                                </Text>
                                <Text type="secondary">
                                  {session.messageCount} messages
                                </Text>
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {formatTimeAgo(session.lastActivity)}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: 'activity',
                  label: (
                    <span>
                      <ClockCircleOutlined />
                      Activity
                    </span>
                  ),
                  children: (
                    <Empty
                      description="Activity feed coming soon"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  )
}
