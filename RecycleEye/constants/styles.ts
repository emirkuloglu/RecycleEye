import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { COLORS } from './colors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  containerBlack: { flex: 1, backgroundColor: 'black' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark },
  content: { flex: 1, padding: 25 },
  cardContainer: { 
    width: '100%', aspectRatio: 1, backgroundColor: COLORS.white, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden', elevation: 3 
  },
  buttonRow: { flexDirection: 'row', gap: 15, marginTop: 100 },
  actionBtn: { flex: 1, height: 55, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: COLORS.white, fontWeight: 'bold' },
  cameraTop: { padding: 20 },
  closeBtn: { width: 45, height: 45, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  cameraBottom: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  resultCard: { backgroundColor: COLORS.white, width: '80%', padding: 20, borderRadius: 15, marginBottom: 20, alignItems: 'center', elevation: 5 },
  resultValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.textDark, marginLeft: 10 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  hintText: { color: '#999' },
  analyzeBtn: { 
    backgroundColor: COLORS.primary, flexDirection: 'row', paddingHorizontal: 30, 
    paddingVertical: 15, borderRadius: 30, alignItems: 'center', gap: 10, elevation: 4 
  },
  analyzeBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  galleryLabel: { position: 'absolute', bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', width: '100%', padding: 10, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10, marginTop: 10 }
});