import { useState, useRef, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { Ionicons } from "@expo/vector-icons"; 
import { COLORS } from "../constants/colors"; 

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Şu an analiz yapılıyor mu?
  const cameraRef = useRef<CameraView>(null);

  // Local IP adresi
  const API_URL = 'http://192.168.1.XX:8000/predict';

  // İzin kontrolü
  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Kamerayı kullanmak için izne ihtiyacımız var.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fotoğrafı çekip sunucuya gönderme fonksiyonu
  const takePictureAndAnalyze = async () => {
    // Eğer zaten bir işlem sürüyorsa veya kamera hazır değilse dur
    if (isProcessing || !cameraRef.current) return;

    try {
      setIsProcessing(true); // İşlem başladı kilidi
      
      // 1. Sessizce, düşük kalitede fotoğraf çek (Hız için kalite 0.3)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true, // Android'de hızlandırır
      });

      if (!photo) return;

      // 2. Sunucuya Gönder
      const formData = new FormData();
      formData.append('file', {
        uri: photo.uri,
        name: 'live.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000 // 5 saniyede cevap gelmezse iptal et
      });

      // 3. Sonucu Yaz
      setResult(response.data.atik_turu);

    } catch (error) {
      console.log("Analiz hatası:", error);
      // Hata olsa bile kullanıcıya hissettirme, bir sonraki kareyi dene
    } finally {
      setIsProcessing(false); // Kildi aç, yeni fotoğraf çekebilirsin
    }
  };

  // Otomatik Döngü (Loop)
  useEffect(() => {
    // Her 1.5 saniyede bir fotoğraf çekmeyi tetikle
    const interval = setInterval(() => {
        takePictureAndAnalyze();
    }, 1500); 

    // Sayfadan çıkınca döngüyü durdur
    return () => clearInterval(interval);
  }, [isProcessing]); // isProcessing değiştiğinde döngüyü kontrol et

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* CANLI KAMERA */}
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={cameraRef}
      >
        {/* Üst Kısım: Logo ve Başlık */}
        <SafeAreaView style={styles.overlayTop}>
           <View style={styles.headerBadge}>
              <Text style={styles.headerText}>RecyclEye Canlı Tarama</Text>
           </View>
        </SafeAreaView>

        {/* Alt Kısım: Sonuç Kutusu */}
        <View style={styles.overlayBottom}>
            <View style={styles.resultCard}>
                <Text style={styles.hintText}>Nesneyi kameraya tutun...</Text>
                
                {isProcessing && !result && (
                    <Text style={styles.loadingText}>Analiz ediliyor...</Text>
                )}

                {result && (
                    <View style={styles.resultRow}>
                        <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                        <View style={{marginLeft: 15}}>
                            <Text style={styles.resultTitle}>Tespit Edildi</Text>
                            <Text style={styles.resultValue}>{result}</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>

      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: COLORS.textDark
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Kamera üzerindeki katmanlar
  overlayTop: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  headerBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  overlayBottom: {
    padding: 20,
    paddingBottom: 50,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 120,
    justifyContent: 'center'
  },
  hintText: {
    color: '#888',
    marginBottom: 10,
    fontSize: 14,
  },
  loadingText: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 14,
    color: '#666',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textTransform: 'capitalize'
  }
});