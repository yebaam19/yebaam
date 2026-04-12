# Terraform Infrastructure - Yebaam Client

Configuración de infraestructura para desplegar el cliente de Yebaam en AWS Amplify usando Terraform.

## Pre-requisitos

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configurado
- Credenciales AWS con permisos para:
  - AWS Amplify
  - S3
  - DynamoDB
  - IAM
- GitHub Personal Access Token con permisos `repo`

## Setup Inicial (Primera vez)

El backend de Terraform (S3 + DynamoDB) debe crearse en **dos pasos**:

### Paso 1: Crear el Backend de Terraform

Primero, comentar temporalmente la configuración del backend en `providers.tf`:

```hcl
# providers.tf
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Comentar esto temporalmente
  # backend "s3" {
  #   bucket         = "yebaam-terraform-state-1762616255"
  #   key            = "client/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "yebaam-terraform-locks"
  # }
}
```

Luego ejecutar:

```bash
# Crear variables de entorno
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con tus valores

# Inicializar Terraform (sin backend)
terraform init

# Crear solo la infraestructura del backend
terraform apply -target=aws_s3_bucket.terraform_state \
                -target=aws_s3_bucket_versioning.terraform_state \
                -target=aws_s3_bucket_server_side_encryption_configuration.terraform_state \
                -target=aws_s3_bucket_public_access_block.terraform_state \
                -target=aws_dynamodb_table.terraform_locks
```

### Paso 2: Migrar al Backend S3

Una vez creado el bucket S3 y la tabla DynamoDB:

1. **Descomentar** la configuración del backend en `providers.tf`
2. Re-inicializar Terraform:

```bash
terraform init -migrate-state
```

Terraform preguntará si quieres migrar el estado local al backend S3. Responder **yes**.

3. Aplicar el resto de la infraestructura:

```bash
terraform plan
terraform apply
```

##  Configuración de Variables

### Variables Requeridas

Editar `terraform.tfvars` con tus valores:

```hcl
# AWS
aws_region  = "us-east-1"
environment = "develop"

# GitHub
github_repository   = "https://github.com/tu-org/tu-repo"
github_access_token = "ghp_xxxxxxxxxxxxx"

# Next.js
next_public_api_url = "https://api.tudominio.com"
next_public_app_url = "https://app.tudominio.com"
nextauth_url        = "https://app.tudominio.com"
nextauth_secret     = "secret-generado-con-openssl"
```

### Generar NextAuth Secret

```bash
openssl rand -base64 32
```

### Obtener GitHub Personal Access Token

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Seleccionar permisos: `repo` (Full control of private repositories)
4. Copiar el token

##  Estructura de Archivos

```
terraform/
├── backend.tf          # Infraestructura del backend (S3 + DynamoDB)
├── providers.tf        # Configuración de providers y backend
├── amplify.tf          # Recursos de AWS Amplify
├── variables.tf        # Definición de variables
├── outputs.tf          # Outputs de Terraform
├── terraform.tfvars    # Valores de variables (no subir a git)
└── terraform.tfvars.example  # Plantilla de variables
```

##  Comandos Útiles

```bash
# Ver plan de cambios
terraform plan

# Aplicar cambios
terraform apply

# Destruir infraestructura
terraform destroy

# Ver estado actual
terraform show

# Listar recursos
terraform state list

# Ver outputs
terraform output

# Formatear código
terraform fmt -recursive

# Validar configuración
terraform validate
```

## 🌍 Manejo de Múltiples Ambientes

### Opción 1: Workspaces (Recomendado)

```bash
# Crear workspace para staging
terraform workspace new staging

# Cambiar a workspace
terraform workspace select develop

# Listar workspaces
terraform workspace list
```

Cada workspace tendrá su propio estado en S3: `client/env:/staging/terraform.tfstate`

### Opción 2: Carpetas Separadas

```
terraform/
├── environments/
│   ├── develop/
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── terraform.tfvars
│   └── production/
│       └── terraform.tfvars
```

## Seguridad

### Archivos Sensibles

Asegúrate de que `.gitignore` incluya:

```
*.tfstate
*.tfstate.*
.terraform/
terraform.tfvars
*.tfvars
!terraform.tfvars.example
```

### Rotación de Secrets

- GitHub token: Rotar cada 90 días
- NextAuth secret: Cambiar al detectar compromisos
- AWS credentials: Usar IAM roles cuando sea posible

## Outputs Importantes

Después de `terraform apply`, verás:

```hcl
amplify_app_id          = "d1234567890abc"
amplify_app_url         = "https://develop.d1234567890abc.amplifyapp.com"
amplify_branch_name     = "develop"
terraform_state_bucket  = "yebaam-terraform-state-1762616255"
terraform_locks_table   = "yebaam-terraform-locks"
```

##  Troubleshooting

### Error: Backend S3 no existe

Si ves este error:
```
Error: S3 bucket does not exist
```

Significa que el backend no fue creado. Sigue el **Paso 1** de Setup Inicial.

### Error: GitHub token inválido

Verificar:
- Token no expirado
- Permisos `repo` habilitados
- Token copiado correctamente sin espacios

### Error: Amplify build failed

Revisar:
- Variables de entorno correctas en `amplify.tf`
- `amplify.yml` válido
- Permisos del IAM role

## 📚 Recursos

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [Terraform Backend S3](https://www.terraform.io/docs/language/settings/backends/s3.html)

## 🤝 Contribuir

1. Hacer cambios en una branch
2. Probar en ambiente de desarrollo
3. Ejecutar `terraform fmt` y `terraform validate`
4. Crear Pull Request

---

**Nota**: Este setup usa el patrón de "backend bootstrap" donde primero se crea la infraestructura del backend de Terraform, y luego se migra el estado a S3. Esto es una mejor práctica que crear el bucket manualmente.
