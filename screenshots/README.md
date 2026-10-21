# 기존 화면의 합성 데이터 캡처

1440×1080 Chromium·한국어·Asia/Seoul 환경에서 기존 React 컴포넌트를 실행해 캡처했습니다. 캘린더는 원본 기본값인 2026년 8월입니다.

- [01-dashboard.png](01-dashboard.png): 관리자 총괄대장
- [02-calendar.png](02-calendar.png): 기존 통합 캘린더
- [03-booking.png](03-booking.png): 평가위원 전용 방문예약
- [04-materials.png](04-materials.png): 기관 자료 메타데이터 관리

테스트마다 새 저장 공간의 합성 초기값을 사용합니다. 기존 기관명 텍스트 로고·디자인을 보존했으므로 화면 공개 권한은 별도 확인이 필요합니다. 화면을 새로 디자인하거나 이미지 생성 도구로 만든 것이 아닙니다.

[캡처 테스트](../tests/browser/flows.spec.ts)
