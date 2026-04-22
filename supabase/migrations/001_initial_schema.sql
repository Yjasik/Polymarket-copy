-- Таблица рынков
CREATE TABLE IF NOT EXISTS markets (
  id BIGINT PRIMARY KEY,                     -- ID рынка в контракте (marketId)
  question TEXT NOT NULL,
  description TEXT,
  image_uri TEXT,
  end_time TIMESTAMPTZ NOT NULL,             -- Время окончания (храним как timestamptz)
  category TEXT DEFAULT 'Other',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ончейн поля (кэшируются для быстрого доступа)
  outcome INTEGER DEFAULT 0,                 -- 0=Undecided, 1=Yes, 2=No, 3=Cancelled
  total_yes NUMERIC DEFAULT 0,
  total_no NUMERIC DEFAULT 0,
  total_pool NUMERIC DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  refunded BOOLEAN DEFAULT FALSE,
  
  -- Денормализованные данные для UI
  volume_24h NUMERIC DEFAULT 0,
  last_trade_price NUMERIC,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для быстрой фильтрации и сортировки
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);
CREATE INDEX IF NOT EXISTS idx_markets_end_time ON markets(end_time);
CREATE INDEX IF NOT EXISTS idx_markets_resolved ON markets(resolved);

-- Включаем Realtime для таблицы markets (чтобы обновления приходили мгновенно)
ALTER PUBLICATION supabase_realtime ADD TABLE markets;

-- (Опционально) Таблица ставок пользователей для истории
CREATE TABLE IF NOT EXISTS user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  outcome BOOLEAN NOT NULL,                  -- true = Yes, false = No
  amount NUMERIC NOT NULL,                   -- в ETH (wei храним как numeric)
  transaction_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_bets_user ON user_bets(user_address);
CREATE INDEX IF NOT EXISTS idx_user_bets_market ON user_bets(market_id);