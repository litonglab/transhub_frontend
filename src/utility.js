export function formatDateTime(dateString) {
  const date = new Date(Date.parse(dateString));
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  };

  const formattedDate = new Intl.DateTimeFormat('zh-CN', options).format(date);
  return formattedDate.replace(/\//g, '-').replace(',', '');
}

import { APIS } from './config.js';
export async function get_pantheon() {
  try {
    const response = await fetch(APIS.get_pantheon, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.pantheon;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching pantheon:', error);
    return [];
  }

}


