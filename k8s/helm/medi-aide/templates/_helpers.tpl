{{/*
Expand the name of the chart.
*/}}
{{- define "medi-aide.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "medi-aide.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "medi-aide.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "medi-aide.labels" -}}
helm.sh/chart: {{ include "medi-aide.chart" . }}
{{ include "medi-aide.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "medi-aide.selectorLabels" -}}
app.kubernetes.io/name: {{ include "medi-aide.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service labels
*/}}
{{- define "medi-aide.serviceLabels" -}}
{{ include "medi-aide.labels" . }}
app.kubernetes.io/component: {{ .serviceName }}
{{- end }}

{{/*
Service selector labels
*/}}
{{- define "medi-aide.serviceSelectorLabels" -}}
{{ include "medi-aide.selectorLabels" . }}
app.kubernetes.io/component: {{ .serviceName }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "medi-aide.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "medi-aide.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Common environment variables for all services
*/}}
{{- define "medi-aide.commonEnv" -}}
- name: NODE_ENV
  value: {{ .Values.global.environment | quote }}
- name: DB_HOST
  value: {{ .Values.database.host | quote }}
- name: DB_PORT
  value: {{ .Values.database.port | quote }}
- name: DB_USER
  value: {{ .Values.database.username | quote }}
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.database.passwordSecret }}
      key: password
- name: REDIS_HOST
  value: {{ .Values.redis.host | quote }}
- name: REDIS_PORT
  value: {{ .Values.redis.port | quote }}
- name: KAFKA_BROKERS
  value: {{ .Values.kafka.brokers | quote }}
- name: TEMPORAL_ADDRESS
  value: "{{ .Values.temporal.host }}:{{ .Values.temporal.port }}"
- name: TEMPORAL_NAMESPACE
  value: {{ .Values.temporal.namespace | quote }}
- name: CONSUL_HOST
  value: "consul"
- name: JAEGER_ENDPOINT
  value: "http://jaeger-collector:14268/api/traces"
{{- end }}

{{/*
Resource limits template
*/}}
{{- define "medi-aide.resources" -}}
resources:
  {{- if .resources }}
  {{- toYaml .resources | nindent 2 }}
  {{- else }}
  {{- toYaml $.Values.serviceDefaults.resources | nindent 2 }}
  {{- end }}
{{- end }}

{{/*
Liveness probe template
*/}}
{{- define "medi-aide.livenessProbe" -}}
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
{{- end }}

{{/*
Readiness probe template
*/}}
{{- define "medi-aide.readinessProbe" -}}
readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
{{- end }}

