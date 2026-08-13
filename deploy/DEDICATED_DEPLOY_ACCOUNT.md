# GitHub Actions 전용 배포 계정

운영 배포는 `main`의 전체 40자리 커밋 SHA만 허용한다. GitHub Actions는
`spaceup-deploy`로 SSH 접속하고, 비밀번호 없는 `sudo`로 서버 역할에 맞는
root 소유 게이트웨이 하나만 실행할 수 있다. 이 계정은 Docker 그룹에 넣지 않는다.

## 설치 전제

- 이 변경이 `main`에 병합되어 두 서버의 `/root/SpaceUP`이 최신화되어 있어야 한다.
- 전용 ED25519 개인키는 GitHub Environment secret에만 저장한다.
- 공개키만 두 서버에 복사한다.
- PUB 서버는 `public`, PRI 서버는 `private` 역할로 설치한다.

## 서버 설치

공개키 한 줄을 `DEPLOY_PUBLIC_KEY` 자리에 넣고 각 서버에서 root로 실행한다.

```bash
# PUB: space-pub-svr
printf '%s\n' 'DEPLOY_PUBLIC_KEY' |
  bash /root/SpaceUP/deploy/scripts/install-deploy-user.sh public

# PRI: space-pri-svr
printf '%s\n' 'DEPLOY_PUBLIC_KEY' |
  bash /root/SpaceUP/deploy/scripts/install-deploy-user.sh private
```

PUB 키는 PRI의 SSH 포트(`10.10.20.6:22`)로 향하는 점프 연결만 허용한다.
PRI 키는 포트 포워딩을 허용하지 않는다. 두 계정 모두 PTY, X11, agent forwarding,
사용자 SSH rc를 허용하지 않는다.

## GitHub Environment secrets

두 환경에 다음 값을 넣는다. 값은 채팅, Git, 로그에 남기지 않는다.

- `SSH_USER`: `spaceup-deploy`
- `SSH_PRIVATE_KEY`: 전용 개인키 원문
- `SSH_KNOWN_HOSTS`: PUB 및 PRI의 검증된 SSH host key
- `PUBLIC_HOST`: PUB의 고정 호스트 또는 IP
- `PRIVATE_HOST`: `10.10.20.6` (`production-private`에만 필요)

## 검증

개인키가 있는 안전한 관리 PC에서 비대화식 로그인을 검사한다.

```bash
ssh -o BatchMode=yes -i DEPLOY_KEY spaceup-deploy@PUBLIC_HOST true
ssh -o BatchMode=yes -i DEPLOY_KEY \
  -J spaceup-deploy@PUBLIC_HOST spaceup-deploy@10.10.20.6 true
```

일반 로그인은 가능하지만 관리자 명령은 지정된 배포 게이트웨이 외에는 거부되어야 한다.
