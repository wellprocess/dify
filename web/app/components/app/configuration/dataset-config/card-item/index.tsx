'use client'
import type { FC } from 'react'
import React from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import TypeIcon from '../type-icon'
import RemoveIcon from '../../base/icons/remove-icon'
import s from './style.module.css'
import { formatNumber } from '@/utils/format'
import Tooltip from '@/app/components/base/tooltip'

export type ICardItemProps = {
  className?: string
  config: any
  onRemove: (id: string) => void
  readonly?: boolean
}

// const RemoveIcon = ({ className, onClick }: { className: string, onClick: () => void }) => (
//   <svg className={className} onClick={onClick} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M10 6H14M6 8H18M16.6667 8L16.1991 15.0129C16.129 16.065 16.0939 16.5911 15.8667 16.99C15.6666 17.3412 15.3648 17.6235 15.0011 17.7998C14.588 18 14.0607 18 13.0062 18H10.9938C9.93927 18 9.41202 18 8.99889 17.7998C8.63517 17.6235 8.33339 17.3412 8.13332 16.99C7.90607 16.5911 7.871 16.065 7.80086 15.0129L7.33333 8M10.6667 11V14.3333M13.3333 11V14.3333" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//   </svg>
// )

const CardItem: FC<ICardItemProps> = ({
  className,
  config,
  onRemove,
  readonly,
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={
        cn(className, s.card,
          'flex items-center justify-between rounded-xl  px-3 py-2.5 bg-white border border-gray-200  cursor-pointer')
      }>
      <div className='shrink-0 flex items-center space-x-2'>
        <div className={cn(!config.embedding_available && 'opacity-50')}>
          <TypeIcon type="upload_file" />
        </div>
        <div>
          <div className='flex items-center w-[160px] mr-1'>
            <div className={cn('text-[13px] leading-[18px] font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap', !config.embedding_available && 'opacity-50')}>{config.name}</div>
            {!config.embedding_available && (
              <Tooltip
                selector={`unavailable-tag-${config.id}`}
                htmlContent={t('dataset.unavailableTip')}
              >
                <span className='shrink-0 px-1 border boder-gray-200 rounded-md text-gray-500 text-xs font-normal leading-[18px]'>{t('dataset.unavailable')}</span>
              </Tooltip>
            )}
          </div>
          <div className={cn('flex text-xs text-gray-500', !config.embedding_available && 'opacity-50')}>
            {formatNumber(config.word_count)} {t('appDebug.feature.dataSet.words')} · {formatNumber(config.document_count)} {t('appDebug.feature.dataSet.textBlocks')}
          </div>
        </div>
      </div>

      {!readonly && <RemoveIcon className={`${s.deleteBtn} shrink-0`} onClick={() => onRemove(config.id)} />}
    </div>
  )
}
export default React.memo(CardItem)
