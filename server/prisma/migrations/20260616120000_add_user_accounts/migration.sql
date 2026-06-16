CREATE TABLE "UserAccount" (
    "tag"          TEXT         NOT NULL,
    "passwordHash" TEXT         NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("tag")
);

-- 預設管理員帳號：admin / test9527
INSERT INTO "UserAccount" ("tag", "passwordHash", "createdAt")
VALUES ('admin', '84967840b89670a0d02089bad86b9b2828f6dbca63fd0d1f89f4f8360e7ce3d0', NOW());
