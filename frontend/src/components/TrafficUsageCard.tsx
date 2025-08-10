import React from 'react'
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from '@mui/material'
import { CloudDownload, Warning, CheckCircle } from '@mui/icons-material'

interface TrafficUsageCardProps {
  trafficUsageMB: number
  trafficLimitMB: number | null
  usagePercentage: number
  isOverLimit: boolean
  keyName?: string
  compact?: boolean
}

const formatTraffic = (mb: number): string => {
  if (mb >= 1000) {
    return `${(mb / 1000).toFixed(1)} GB`
  }
  return `${mb} MB`
}

const getProgressColor = (percentage: number, isOverLimit: boolean) => {
  if (isOverLimit) return 'error'
  if (percentage >= 90) return 'warning'
  if (percentage >= 75) return 'info'
  return 'success'
}

const TrafficUsageCard: React.FC<TrafficUsageCardProps> = ({
  trafficUsageMB,
  trafficLimitMB,
  usagePercentage,
  isOverLimit,
  keyName,
  compact = false,
}) => {
  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1} minWidth={200}>
        <CloudDownload fontSize="small" color={isOverLimit ? 'error' : 'primary'} />
        <Box flex={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {formatTraffic(trafficUsageMB)}
              {trafficLimitMB && ` / ${formatTraffic(trafficLimitMB)}`}
            </Typography>
            <Typography variant="caption" color={isOverLimit ? 'error' : 'text.secondary'}>
              {trafficLimitMB ? `${usagePercentage.toFixed(1)}%` : 'No limit'}
            </Typography>
          </Box>
          {trafficLimitMB && (
            <LinearProgress
              variant="determinate"
              value={Math.min(usagePercentage, 100)}
              color={getProgressColor(usagePercentage, isOverLimit)}
              sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
            />
          )}
        </Box>
        {isOverLimit && (
          <Tooltip title="Traffic limit exceeded">
            <Warning color="error" fontSize="small" />
          </Tooltip>
        )}
      </Box>
    )
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <CloudDownload color={isOverLimit ? 'error' : 'primary'} />
          <Box flex={1}>
            <Typography variant="h6" component="div">
              Traffic Usage
            </Typography>
            {keyName && (
              <Typography variant="body2" color="text.secondary">
                {keyName}
              </Typography>
            )}
          </Box>
          <Chip
            icon={isOverLimit ? <Warning /> : <CheckCircle />}
            label={isOverLimit ? 'Over Limit' : 'Within Limit'}
            color={isOverLimit ? 'error' : 'success'}
            size="small"
          />
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Used: {formatTraffic(trafficUsageMB)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trafficLimitMB ? `Limit: ${formatTraffic(trafficLimitMB)}` : 'No limit set'}
            </Typography>
          </Box>
          
          {trafficLimitMB ? (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                color={getProgressColor(usagePercentage, isOverLimit)}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  0%
                </Typography>
                <Typography 
                  variant="caption" 
                  color={isOverLimit ? 'error.main' : 'text.secondary'}
                  fontWeight={isOverLimit ? 'bold' : 'normal'}
                >
                  {usagePercentage.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  100%
                </Typography>
              </Box>
            </>
          ) : (
            <Box 
              sx={{ 
                height: 8, 
                borderRadius: 4, 
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                No limit configured
              </Typography>
            </Box>
          )}
        </Box>

        {trafficLimitMB && (
          <Typography variant="caption" color="text.secondary">
            Remaining: {formatTraffic(Math.max(0, trafficLimitMB - trafficUsageMB))}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default TrafficUsageCard